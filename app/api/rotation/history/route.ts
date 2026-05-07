import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/rotation/history
export async function GET(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const workspaceId = searchParams.get("workspaceId");

    // Fetch history logs
    // We navigate from Log -> Schedule -> Secret -> Project to filter
    let whereClause: any = {};
    
    if (projectId) {
      whereClause = { schedule: { projectId } };
    } else if (workspaceId) {
      const { getUserWorkspaceRole } = await import("@/lib/permissions");
      const role = await getUserWorkspaceRole(auth.userId, workspaceId);

      if (role === "owner" || role === "admin") {
        whereClause = { schedule: { secret: { project: { workspaceId } } } };
      } else {
        whereClause = {
          schedule: {
            secret: {
              project: {
                workspaceId,
                OR: [
                  { userId: auth.userId },
                  {
                    teamProjects: {
                      some: {
                        team: { members: { some: { userId: auth.userId, status: "active" } } }
                      }
                    }
                  }
                ]
              }
            }
          }
        };
      }
    } else {
      whereClause = {
        schedule: {
          secret: {
            project: {
              OR: [
                { userId: auth.userId },
                {
                  teamProjects: {
                    some: {
                      team: { members: { some: { userId: auth.userId, status: "active" } } }
                    }
                  }
                }
              ]
            }
          }
        }
      };
    }

    const history = await prisma.rotationLog.findMany({
      where: whereClause,
      include: {
        schedule: {
            include: {
                secret: {
                    select: {
                        key: true,
                        branch: { select: { name: true } },
                        project: { select: { name: true } }
                    }
                }
            }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 50 // Limit to last 50 for now
    });

    const formattedHistory = history.map(h => ({
      id: h.id,
      secretId: h.schedule.secretId,
      secretKey: h.schedule.secret.key,
      projectName: h.schedule.secret.project.name,
      branch: h.schedule.secret.branch?.name || "Global",
      rotationType: h.schedule.method === "manual" ? "manual" : "scheduled", // Simplified mapping
      status: h.status,
      // We don't log the actual values in history API for security, just success/fail
      oldValue: "***", 
      newValue: "***",
      rotatedBy: "system", // We'd need to store 'triggeredBy' in Log to be accurate
      rotatedAt: h.completedAt?.toISOString() || h.startedAt.toISOString(),
      duration: h.completedAt ? (h.completedAt.getTime() - h.startedAt.getTime()) : 0,
      errorMessage: h.error,
      rollbackAvailable: false // Not implemented yet
    }));

    return NextResponse.json(formattedHistory);
  } catch (error: any) {
    console.error("GET /rotation/history error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
