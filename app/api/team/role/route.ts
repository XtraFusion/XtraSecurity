import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { getUserTeamRole, canEditRole } from "@/lib/permissions";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

                const { memberId, newRole } = await req.json();

                // load teamUser to get teamId and target role
                const targetTeamUser = await prisma.teamUser.findUnique({ where: { id: memberId } });
                if (!targetTeamUser) {
                    return NextResponse.json({ error: "Team member not found" }, { status: 404 });
                }

                const currentUserRole = await getUserTeamRole(session.user.id, targetTeamUser.teamId);
                if (!canEditRole(currentUserRole, targetTeamUser.role)) {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
                }

                // Prevent removing last admin
                if (targetTeamUser.role === "admin" || targetTeamUser.role === "owner") {
                    if (newRole !== "admin" && newRole !== "owner") {
                        const adminCount = await prisma.teamUser.count({
                            where: {
                                teamId: targetTeamUser.teamId,
                                role: { in: ["admin", "owner"] }
                            }
                        });

                        if (adminCount <= 1) {
                             return NextResponse.json({ error: "Cannot remove the last admin from the team" }, { status: 400 });
                        }
                    }
                }

                const roleUpdate = await prisma.teamUser.updateMany({
                        where: { id: memberId },
                        data: { role: newRole },
                });

        // Create audit log
        try {
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: "role_change",
                    entity: "team_user",
                    entityId: memberId,
                    changes: { newRole },
                },
            });
        } catch (auditErr) {
            console.error("Failed to write audit log for role change:", auditErr);
        }

        // Create notification for the affected user (if we can resolve userId)
        try {
            const teamUser = await prisma.teamUser.findUnique({ where: { id: memberId } });
            if (teamUser) {
                const targetUser = await prisma.user.findUnique({ where: { id: teamUser.userId } });
                if (targetUser) {
                    await prisma.notification.create({
                        data: {
                            userId: targetUser.id,
                            userEmail: targetUser.email || "",
                            taskTitle: "Role changed",
                            description: `Your role was changed to ${newRole}`,
                            message: `Your team role has been updated to ${newRole} by ${session.user.email}`,
                            status: "unread",
                            read: false,
                        },
                    });
                    await dispatchNotification({
                      title: "Team Role Changed",
                      message: `${targetUser.email}'s role was changed to *${newRole}*`,
                      type: "warning",
                      fields: [
                        { label: "User", value: targetUser.email || "" },
                        { label: "New Role", value: newRole },
                        { label: "Changed by", value: session.user.email || "" },
                      ],
                    });
                }
            }
        } catch (notifErr) {
            console.error("Failed to create notification for role change:", notifErr);
        }

        return NextResponse.json(roleUpdate, { status: 200 });
    } catch (error) {
        console.error("Error updating team member role:", error);
        return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }
}

