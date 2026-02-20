import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export async function POST(req: Request) {
  try {
    const { teamId, status = "active" } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (status === "active") {
      const acceptInvite = await prisma.teamUser.update({
        where: { 
          teamId_userId: { 
            teamId, 
            userId: session.user.id 
          } 
        },
        data: { status },
      });

      // audit log
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "invite_accepted",
            entity: "team_user",
            entityId: teamId,
            changes: { status },
          },
        });
      } catch (auditErr) {
        console.error("Failed to write audit log for invite acceptance:", auditErr);
      }

      // notify inviter if available
      try {
        if (acceptInvite.invitedBy) {
          const inviter = await prisma.user.findUnique({ where: { id: acceptInvite.invitedBy } });
          if (inviter) {
            await prisma.notification.create({
              data: {
                userId: inviter.id,
                userEmail: inviter.email || "",
                taskTitle: "Invite accepted",
                description: `${session.user.email} accepted your team invite`,
                message: `${session.user.email} joined the team`,
                status: "unread",
                read: false,
              },
            });
            await dispatchNotification({
              title: "Invite Accepted",
              message: `${session.user.email} accepted a team invite`,
              type: "success",
            });
          }
        }
      } catch (notifErr) {
        console.error("Failed to notify inviter for invite acceptance:", notifErr);
      }

      return NextResponse.json({ message: "Invitation accepted", acceptInvite }, { status: 200 });
    }

    if (status === "decline") {
      const deleteTeamUser = await prisma.teamUser.delete({
        where: { teamId_userId: { teamId, userId: session.user.id } },
      });

      // audit log
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "invite_declined",
            entity: "team_user",
            entityId: teamId,
            changes: { status },
          },
        });
      } catch (auditErr) {
        console.error("Failed to write audit log for invite decline:", auditErr);
      }

      return NextResponse.json({ message: "Invitation rejected", deleteTeamUser }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid status value" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /team/invite/response error:", error);

    // Handle Prisma record not found
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
