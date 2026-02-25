import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/admin/users - List all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin — accept either the legacy User.role field
    // OR an admin/owner role via the RBAC UserRole table
    const currentUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        userRoles: {
          include: { role: { select: { name: true } } }
        }
      }
    });

    const hasAdminRole = currentUser?.userRoles?.some(
      ur => ur.role.name === "admin" || ur.role.name === "owner"
    );
    const isAdmin =
      currentUser?.role === "admin" ||
      currentUser?.role === "owner" ||
      hasAdminRole;

    if (!currentUser || !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");

    let users;
    if (teamId) {
      // Get users for specific team
      const teamUsers = await prisma.teamUser.findMany({
        where: { teamId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              image: true,
              createdAt: true
            }
          }
        }
      });
      users = teamUsers.map(tu => ({
        ...tu.user,
        teamRole: tu.role,
        status: tu.status
      }));
    } else {
      // Get all users
      users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          image: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      });
    }

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
