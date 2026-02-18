import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getUserTeamRole, canRemoveMember } from "@/lib/permissions";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await req.json();

    // Find the teamUser to get team info and userId for notification
    const teamUser = await prisma.teamUser.findUnique({ where: { id: memberId } });
    if (!teamUser) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const currentUserRole = await getUserTeamRole(session.user.id, teamUser.teamId);
    if (!canRemoveMember(currentUserRole, teamUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleteMember = await prisma.teamUser.deleteMany({ where: { id: memberId } });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "member_removed",
          entity: "team_user",
          entityId: memberId,
          changes: { removedMemberId: memberId },
        },
      });
    } catch (auditErr) {
      console.error("Failed to write audit log for member removal:", auditErr);
    }

    // Notification
    try {
      if (teamUser) {
        const targetUser = await prisma.user.findUnique({ where: { id: teamUser.userId } });
        if (targetUser) {
          await prisma.notification.create({
            data: {
              userId: targetUser.id,
              userEmail: targetUser.email || "",
              taskTitle: "Removed from team",
              description: "You have been removed from a team",
              message: `You were removed from the team by ${session.user.email}`,
              status: "unread",
              read: false,
            },
          });
          await dispatchNotification({
            title: "Team Member Removed",
            message: `${targetUser.email} was removed from the team`,
            type: "error",
            fields: [{ label: "Removed by", value: session.user.email || "" }],
          });
        }
      }
    } catch (notifErr) {
      console.error("Failed to create notification for member removal:", notifErr);
    }

    return NextResponse.json(
      { message: "Member removed successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error removing member" },
      { status: 500 }
    );
  }
}
