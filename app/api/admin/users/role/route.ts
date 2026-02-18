import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { UserRole } from "@/lib/authz/types";

// PUT /api/admin/users/role - Update user role
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is admin or owner
    const currentUser = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "owner")) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { email, role, teamId } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Validate role
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json({ 
        error: `Invalid role. Valid roles: ${validRoles.join(", ")}` 
      }, { status: 400 });
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent demoting self if only admin
    if (targetUser.id === auth.userId && role !== "admin" && role !== "owner") {
      const adminCount = await prisma.user.count({
        where: { role: { in: ["admin", "owner"] } }
      });
      if (adminCount <= 1) {
        return NextResponse.json({ 
          error: "Cannot demote yourself - you are the only admin" 
        }, { status: 400 });
      }
    }

    if (teamId) {
      // Update team-specific role
      const teamUser = await prisma.teamUser.findFirst({
        where: {
          userId: targetUser.id,
          teamId: teamId
        }
      });

      if (!teamUser) {
        return NextResponse.json({ error: "User is not a member of this team" }, { status: 404 });
      }

      await prisma.teamUser.update({
        where: { id: teamUser.id },
        data: { role }
      });
    } else {
      // Update global user role
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { role }
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "role_change",
        entity: teamId ? "team_user" : "user",
        entityId: targetUser.id,
        changes: { newRole: role, teamId }
      }
    });

    // Create notification for target user
    try {
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          userEmail: targetUser.email || "",
          taskTitle: "Role Updated",
          description: `Your role has been changed to ${role}`,
          message: `Your role was updated by ${currentUser.email}`,
          status: "unread",
          read: false
        }
      });
    } catch (e) {
      // Non-critical, continue
    }

    return NextResponse.json({ 
      success: true, 
      message: `Role updated: ${email} → ${role}` 
    });

  } catch (error: any) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
