import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { RotationService } from "@/lib/rotation-service";
import prisma from "@/lib/db";

// POST /api/rotation/run
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scheduleId } = await req.json();

    if (!scheduleId) {
        return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });
    }

    // RBAC Check
    // 1. Get Schedule -> Secret -> Project
    const schedule = await prisma.rotationSchedule.findUnique({
        where: { id: scheduleId },
        include: { secret: true }
    });

    if (!schedule || !schedule.secret) {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const { getUserProjectRole } = await import("@/lib/permissions");
    const role = await getUserProjectRole(session.user.id, schedule.secret.projectId);

    if (!role || (role !== "owner" && role !== "admin" && role !== "developer")) {
         return NextResponse.json({ error: "Forbidden: Insufficient permissions to rotate secrets" }, { status: 403 });
    }

    const result = await RotationService.rotateSecret(scheduleId, session.user.email || "user");

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /rotation/run error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
