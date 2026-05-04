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
    const workspaceId = searchParams.get("workspaceId");

    // Fetch schedules
    // Strict isolation to only projects the user owns or belongs to via teams, unless workspace admin
    let whereClause: any = {};
    if (projectId) {
      whereClause = { projectId };
    } else if (workspaceId) {
      const { getUserWorkspaceRole } = await import("@/lib/permissions");
      const role = await getUserWorkspaceRole(session.user.id, workspaceId);

      if (role === "owner" || role === "admin") {
        whereClause = { secret: { project: { workspaceId } } };
      } else {
        whereClause = {
          secret: {
            project: {
              workspaceId,
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
      }
    } else {
      whereClause = {
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
    }

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

    // Create Schedule — calculate nextRotation based on frequency
    const nextRotation = new Date();
    const freqDays: Record<string, number> = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      quarterly: 90,
    };
    const daysToAdd = frequency === "custom" && customDays ? customDays : (freqDays[frequency] || 30);
    nextRotation.setDate(nextRotation.getDate() + daysToAdd);

    const schedule = await prisma.rotationSchedule.create({
      data: {
        secretId: secret.id,
        projectId,
        environment: secret.environmentType,
        frequency,
        customDays: frequency === "custom" ? customDays : null,
        nextRotation,
        method: rotationMethod,
        webhookUrl,
        status: "active"
      },
      include: {
        secret: {
          select: {
            id: true,
            key: true,
            branch: { select: { name: true } },
            project: { select: { name: true } }
          }
        }
      }
    });

    const formattedSchedule = {
      id: schedule.id,
      secretId: schedule.secretId,
      secretKey: schedule.secret.key,
      projectId: schedule.projectId,
      projectName: schedule.secret.project.name,
      branch: schedule.secret.branch?.name || "Global",
      frequency: schedule.frequency,
      customDays: schedule.customDays,
      enabled: schedule.status === "active",
      nextRotation: schedule.nextRotation?.toISOString(),
      lastRotation: schedule.lastRotation?.toISOString(),
      rotationMethod: schedule.method,
      webhookUrl: schedule.webhookUrl,
      createdAt: schedule.createdAt?.toISOString(),
    };

    return NextResponse.json(formattedSchedule, { status: 201 });
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
