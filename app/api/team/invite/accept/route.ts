import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { verifyAuth } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { teamId, status = "active" } = await req.json();

    const auth = await verifyAuth(req);
    if (!auth || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = auth.userId;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { workspaceId: true }
    });

    if (status === "active") {
      const acceptInvite = await prisma.teamUser.update({
        where: { 
          teamId_userId: { 
            teamId, 
            userId: auth.userId 
          } 
        },
        data: { status },
      });

      // audit log
      try {
        await logAudit("MEMBER_INVITE_ACCEPTED", auth.userId, teamId, { status }, team?.workspaceId || undefined);
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
                description: `${auth.email} accepted your team invite`,
                message: `${auth.email} joined the team`,
                status: "unread",
                read: false,
              },
            });
            await dispatchNotification({
              title: "Invite Accepted",
              message: `${auth.email} accepted a team invite`,
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
        where: { teamId_userId: { teamId, userId: auth.userId } },
      });

      // audit log
      try {
        await logAudit("MEMBER_INVITE_DECLINED", auth.userId, teamId, { status }, team?.workspaceId || undefined);
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
      { error: "Server error" },
      { status: 500 }
    );
  }
}
