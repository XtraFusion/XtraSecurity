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
if (!session?.user?.email) {
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
          branch: true,
          teamProjects: {
            include: {
              team: true
            }
          }
        }
      });
      console.log(projects)
      return NextResponse.json(projects);
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
        branch: true,
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

    return NextResponse.json(project);
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
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        branch: {
          create: {
            name: "main",
            description: "Initial main branch",
            createdBy: session.user.id,
            versionNo: "1",
            permissions: [session.user.email],
            createdAt: new Date()
          }
        }
      },
      include: {
        branch: true,
        secret: true,
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
        branch: true,
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