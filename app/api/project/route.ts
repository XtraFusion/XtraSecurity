import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";


// GET /api/project - Get all projects or a specific project by ID
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session in GET /api/project:", session);
    
    if (!session?.user?.email) {
      console.log("No session or email found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      // Get all projects accessible to the user
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            {
              teamProjects: {
                some: {
                  team: {
                    members: {
                      some: {
                        userId: session.user.id
                      }
                    }
                  }
                }
              }
            }
          ]
        },
        include: {
          branches: true,
          secrets: true,
          teamProjects: {
            include: {
              team: true
            }
          }
        }
      });
      console.log("Fetched projects:", projects.length);
      // Ensure dates and optional fields serialize cleanly for NextResponse
      const safe = projects.map((p: any) => ({
        ...p,
        createdAt: p.createdAt?.toISOString?.() ?? null,
        updatedAt: p.updatedAt?.toISOString?.() ?? null,
        branch: p.branch?.map((b: any) => ({ ...b, createdAt: b.createdAt?.toISOString?.() ?? null })) ?? [],
        secret: p.secret?.map((s: any) => ({ ...s, lastUpdated: s.lastUpdated?.toISOString?.() ?? null })) ?? []
      }));

      return NextResponse.json(safe);
    }

    // Get specific project with access check
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          {
            teamProjects: {
              some: {
                team: {
                  members: {
                    some: {
                      userId: session.user.id
                    }
                  }
                }
              }
            }
          }
        ]
      },
      include: {
        branches: true,
        teamProjects: {
          include: {
            team: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Serialize dates on single project response
    const safeProject = {
      ...project,
      createdAt: project.createdAt?.toISOString?.() ?? null,
      updatedAt: project.updatedAt?.toISOString?.() ?? null,
      branches: project.branches?.map((b: any) => ({ ...b, createdAt: b.createdAt?.toISOString?.() ?? null })) ?? []
    };

    return NextResponse.json(safeProject);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/project - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(session.user)

    const newProject = await request.json();

    // Resolve the actual user record in the database. Depending on your
    // NextAuth/session setup session.user.id may be undefined or contain
    // an identifier that doesn't match Prisma's User.id (ObjectId). Try to
    // find the user by id first, then fallback to email.
    const authUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user?.id ?? undefined },
          { email: session.user?.email ?? undefined },
        ].filter(Boolean) as any,
      },
    });
console.log(authUser)
    if (!authUser) {
      console.error("Authenticated user not found in database for session:", session.user);
      return NextResponse.json({ error: "Authenticated user not found" }, { status: 401 });
    }

    if (!newProject.name || !newProject.description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    // Create project with the data from frontend and initialize required fields
    const project = await prisma.project.create({
      data: {
        name: newProject.name,
        description: newProject.description,
        userId: authUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        workspaceId: newProject.workspaceId,
        branches: {
          create: {
            name: "main",
            description: "Initial main branch",
            createdBy: authUser.id,
            versionNo: "1",
            permissions: [authUser.email].filter(Boolean) as string[],
            createdAt: new Date()
          }
        }
      },
      include: {
        branches: true,
        secrets: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// DELETE /api/project - Delete a project
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}


    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to delete the project
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.email // Only creator can delete
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or permission denied" },
        { status: 404 }
      );
    }

    // Delete project and all related data (cascading delete handled by Prisma)
    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

// PUT /api/project - Update a project
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}


    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const { name, description, teamIds } = body;

    if (!id || !name || !description) {
      return NextResponse.json(
        { error: "Project ID, name, and description are required" },
        { status: 400 }
      );
    }

    // Check if user has permission to update the project
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.email },
          {
            teamProjects: {
              some: {
                team: {
                  members: {
                    some: {
                      userId: session.user.email,
                      role: "admin" // Only team admins can update
                    }
                  }
                }
              }
            }
          }
        ]
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found or permission denied" },
        { status: 404 }
      );
    }

    // Update project
    const updateData: any = {
      name,
      description
    };

    // Update team associations if provided
    if (teamIds) {
      // Only project owner can update team associations
      if (existingProject.userId !== session.user.email) {
        return NextResponse.json(
          { error: "Only project owner can update team associations" },
          { status: 403 }
        );
      }

      // Delete existing team associations and create new ones
      await prisma.teamProject.deleteMany({
        where: { projectId: id }
      });

      updateData.teamProjects = {
        create: teamIds.map((teamId: string) => ({
          teamId
        }))
      };
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        branches: true,
        teamProjects: {
          include: {
            team: true
          }
        }
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}