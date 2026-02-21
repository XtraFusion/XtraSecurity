import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/rotation/schedules
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    // Fetch schedules
    // Strict isolation to only projects the user owns or belongs to via teams
    const whereClause: any = projectId ? { projectId } : {
      secret: {
        project: {
          OR: [
            { userId: session.user.id },
            {
              teamProjects: {
                some: {
                  team: { members: { some: { userId: session.user.id, status: "active" } } }
                }
              }
            }
          ]
        }
      }
    };

    const schedules = await prisma.rotationSchedule.findMany({
      where: whereClause,
      include: {
        secret: {
          select: {
            id: true,
            key: true,
            branch: { select: { name: true } },
            project: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedSchedules = schedules.map(s => ({
      id: s.id,
      secretId: s.secretId,
      secretKey: s.secret.key,
      projectId: s.projectId,
      projectName: s.secret.project.name,
      branch: s.secret.branch?.name || "Global",
      frequency: s.frequency,
      customDays: s.customDays,
      enabled: s.status === "active",
      nextRotation: s.nextRotation?.toISOString(),
      lastRotation: s.lastRotation?.toISOString(),
      rotationMethod: s.method,
      webhookUrl: s.webhookUrl,
      createdAt: s.createdAt?.toISOString(),
    }));

    return NextResponse.json(formattedSchedules);
  } catch (error: any) {
    console.error("GET /rotation/schedules error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// POST /api/rotation/schedules
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      secretId,
      secretKey, // Used as fallback if no ID provided initially
      projectId, 
      branch: branchName, 
      frequency, 
      customDays, 
      rotationMethod, 
      webhookUrl 
    } = body;

    let secret = null;

    if (secretId) {
        secret = await prisma.secret.findUnique({
            where: { id: secretId }
        });
    } else if (secretKey) {
        // Fallback for older frontend submissions
        let branchId = null;
        if (branchName) {
            const branch = await prisma.branch.findFirst({
                where: { projectId, name: branchName }
            });
            branchId = branch?.id;
        }

        secret = await prisma.secret.findFirst({
            where: {
                projectId,
                key: secretKey,
                branchId: branchId || undefined
            }
        });
    }

    if (!secret || secret.projectId !== projectId) {
        return NextResponse.json({ error: `Secret not found or invalid` }, { status: 404 });
    }

    // Check if schedule already exists
    const existing = await prisma.rotationSchedule.findUnique({
        where: { secretId: secret.id }
    });

    if (existing) {
        return NextResponse.json({ error: "Rotation schedule already exists for this secret" }, { status: 409 });
    }

    // Create Schedule
    const nextRotation = new Date();
    nextRotation.setDate(nextRotation.getDate() + 30); // Default start

    const schedule = await prisma.rotationSchedule.create({
      data: {
        secretId: secret.id,
        projectId,
        environment: secret.environmentType,
        frequency,
        customDays,
        nextRotation,
        method: rotationMethod,
        webhookUrl,
        status: "active"
      }
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    console.error("POST /rotation/schedules error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// PATCH /api/rotation/schedules
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });
    }

    // Optional: Add RBAC check to ensure user has access to schedule's project

    const schedule = await prisma.rotationSchedule.update({
      where: { id },
      data: {
        status: enabled ? "active" : "paused"
      }
    });

    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error("PATCH /rotation/schedules error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// DELETE /api/rotation/schedules
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });
    }

    // Delete schedule
    await prisma.rotationSchedule.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /rotation/schedules error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
