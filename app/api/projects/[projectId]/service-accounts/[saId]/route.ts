import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/server-auth";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; saId: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (auth.isServiceAccount) {
      return NextResponse.json({ error: "Service accounts cannot manage other service accounts" }, { status: 403 });
    }

    const { projectId, saId } = params;

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
            { userId: auth.userId },
            {
              teamProjects: {
                some: {
                  team: {
                    members: {
                      some: {
                        userId: auth.userId,
                        status: "active"
                      }
                    }
                  }
                }
              }
            }
          ]
      }
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Verify SA exists
    const sa = await prisma.serviceAccount.findUnique({
        where: { id: saId }
    });
    
    if (!sa || sa.projectId !== projectId) {
        return NextResponse.json({ error: "Service Account not found" }, { status: 404 });
    }

    // Delete related API keys first (optional if cascade is set, but explicit is better)
    await prisma.apiKey.deleteMany({
        where: { serviceAccountId: saId }
    });

    await prisma.serviceAccount.delete({
      where: { id: saId }
    });

    try {
      await logAudit(
        "SERVICE_ACCOUNT_DELETED",
        auth.userId,
        projectId,
        { saId, saName: sa.name }
      );
    } catch (e) {
      console.error("Audit log failed:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE service-account error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { projectId: string; saId: string } }
  ) {
    try {
      const auth = await verifyAuth(req);
      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (auth.isServiceAccount) {
        return NextResponse.json({ error: "Service accounts cannot manage other service accounts" }, { status: 403 });
      }
  
      const { projectId, saId } = params;
      const body = await req.json();
      const { name, permissions } = body;
  
      // Verify project access
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
              { userId: auth.userId },
              {
                teamProjects: {
                  some: {
                    team: {
                      members: {
                        some: {
                          userId: auth.userId,
                          status: "active"
                        }
                      }
                    }
                  }
                }
              }
            ]
        }
      });
  
      if (!project) {
          return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
      }
  
      const updated = await prisma.serviceAccount.update({
        where: { id: saId },
        data: {
            name,
            permissions
        }
      });

      try {
        await logAudit(
          "SERVICE_ACCOUNT_UPDATED",
          auth.userId,
          projectId,
          { saId, name, permissions }
        );
      } catch (e) {
        console.error("Audit log failed:", e);
      }
  
      return NextResponse.json(updated);
    } catch (error) {
      console.error("PATCH service-account error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
