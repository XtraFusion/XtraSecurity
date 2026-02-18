import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string; saId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, saId } = params;

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
            { userId: session.user.id },
            {
              teamProjects: {
                some: {
                  team: {
                    members: {
                      some: {
                        userId: session.user.id,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE service-account error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
    req: Request,
    { params }: { params: { projectId: string; saId: string } }
  ) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const { projectId, saId } = params;
      const body = await req.json();
      const { name, permissions } = body;
  
      // Verify project access
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
              { userId: session.user.id },
              {
                teamProjects: {
                  some: {
                    team: {
                      members: {
                        some: {
                          userId: session.user.id,
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
  
      return NextResponse.json(updated);
    } catch (error) {
      console.error("PATCH service-account error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
