import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { createNotification } from "@/lib/notifications";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/project - Get all projects or a specific project by ID
export async function GET(request: NextRequest) {
  try {
    // Try CLI auth first, then session
    const cliAuth = await verifyAuth(request);
    const session = await getServerSession(authOptions);
    
    const userId = cliAuth?.userId || session?.user?.id;
    const userEmail = cliAuth?.email || session?.user?.email;
    
    if (!userId) {
      console.log("No auth found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const workspaceId = searchParams.get("workspaceId");

    if (!id) {
      // Get all projects accessible to the user
      const projects = await prisma.project.findMany({
        where: {
          AND: [
            workspaceId ? { workspaceId } : {},
            {
              OR: [
                { userId: userId },
                {
                  teamProjects: {
                    some: {
                      team: {
                        members: {
                          some: {
                            userId: userId,
                            status: "active",
                          },
                        },
                      },
                    },
                  },
                },
              ],
            }
          ]
        },
        include: {
          branches: true,
          secrets: {
            select: {
              id: true,
              key: true,
              description: true,
              environmentType: true,
              type: true,
              lastUpdated: true,
              expiryDate: true,
              rotationPolicy: true
            }
          },
          teamProjects: {
            include: {
              team: true,
            },
          },
        },
      });
      console.log("Fetched projects:", projects.length);
      // Ensure dates and optional fields serialize cleanly for NextResponse
      const safe = projects.map((p: any) => ({
        ...p,
        createdAt: p.createdAt?.toISOString?.() ?? null,
        updatedAt: p.updatedAt?.toISOString?.() ?? null,
        branches:
          p.branches?.map((b: any) => ({
            ...b,
            createdAt: b.createdAt?.toISOString?.() ?? null,
          })) ?? [],
        secrets:
          p.secrets?.map((s: any) => ({
            ...s,
            lastUpdated: s.lastUpdated?.toISOString?.() ?? null,
          })) ?? [],
      }));

      return NextResponse.json(safe);
    }

    // Get specific project with access check
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: userId },
          {
            teamProjects: {
              some: {
                team: {
                  members: {
                    some: {
                      userId: userId,
                      status: "active",
                    },
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        branches: true,
        secrets: {
            select: {
              id: true,
              key: true,
              description: true,
              environmentType: true,
              type: true,
              lastUpdated: true,
              expiryDate: true,
              rotationPolicy: true
            }
        },
        teamProjects: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }
    
    // Compute currentUserRole for frontend permission checks
    const { getUserProjectRole } = await import("@/lib/permissions");
    const role = await getUserProjectRole(userId, project.id);

    // Enforce Blocked status (Only owners and admins can access a blocked project to unblock it)
    if (project.isBlocked && role !== "owner" && role !== "admin") {
        return NextResponse.json(
            { error: "This project has been blocked by the owner and is currently inaccessible." },
            { status: 403 }
        );
    }

    // Serialize dates on single project response
    const safeProject = {
      ...project,
      currentUserRole: role,
      createdAt: project.createdAt?.toISOString?.() ?? null,
      updatedAt: project.updatedAt?.toISOString?.() ?? null,
      branches:
        project.branches?.map((b: any) => ({
          ...b,
          createdAt: b.createdAt?.toISOString?.() ?? null,
        })) ?? [],
      secrets:
        project.secrets?.map((s: any) => ({
            ...s,
            lastUpdated: s.lastUpdated?.toISOString?.() ?? null,
        })) ?? [],
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
    console.log(session.user);

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
    console.log(authUser);
    if (!authUser) {
      console.error(
        "Authenticated user not found in database for session:",
        session.user
      );
      return NextResponse.json(
        { error: "Authenticated user not found" },
        { status: 401 }
      );
    }

    // RBAC Check: Workspace Owner/Admin
    if (newProject.workspaceId) {
        const { getUserWorkspaceRole } = await import("@/lib/permissions");
        const role = await getUserWorkspaceRole(authUser.id, newProject.workspaceId);
        if (!role || (role !== "owner" && role !== "admin")) {
             return NextResponse.json({ error: "Only workspace owners and admins can create projects." }, { status: 403 });
        }
    }

    console.log("Received project data:", newProject);

    if (!newProject.name) {
      console.error("Project name is missing");
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    if (!newProject.description) {
      console.error("Project description is missing");
      return NextResponse.json(
        { error: "Project description is required" },
        { status: 400 }
      );
    }

    if (!newProject.workspaceId) {
      console.error("Workspace ID is missing");
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    // Rate Limit Check for Projects
    const userTier = (authUser.tier || "free") as import("@/lib/rate-limit-config").Tier;
    const projectLimit = import("@/lib/rate-limit-config").then(mod => mod.DAILY_LIMITS[userTier].maxProjectsPerWorkspace);
    
    const resolvedProjectLimit = await projectLimit;

    const projectCount = await prisma.project.count({
      where: { workspaceId: newProject.workspaceId }
    });

    if (projectCount >= resolvedProjectLimit) {
      return NextResponse.json({ 
        error: "Project limit reached", 
        message: `Your ${userTier} plan allows creating up to ${resolvedProjectLimit} projects per workspace. Please upgrade for more capacity.` 
      }, { status: 403 });
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
            createdAt: new Date(),
          },
        },
      },
      include: {
        branches: true,
        secrets: {
            select: {
              id: true,
              key: true,
              description: true,
              environmentType: true,
              type: true,
              lastUpdated: true,
              expiryDate: true,
              rotationPolicy: true
            }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });



    // Notify user
    await createNotification(
      authUser.id,
      authUser.email!,
      "Project Created",
      `Project "${project.name}" created`,
      `You successfully created project "${project.name}" in workspace ${newProject.workspaceId}.`,
      "success"
    );

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

    // Check existence
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check permission: Workspace Admin/Owner OR Project Creator
    const { getUserWorkspaceRole } = await import("@/lib/permissions");
    const role = await getUserWorkspaceRole(session.user.id, project.workspaceId);
    const isCreator = project.userId === session.user.id;

    if (!isCreator && (!role || (role !== "owner" && role !== "admin"))) {
         return NextResponse.json({ error: "Only the project owner or workspace admin can delete this project" }, { status: 403 });
    }

    await prisma.$transaction(async (prisma) => {
      // Delete related secrets
      await prisma.secret.deleteMany({
        where: { projectId: id },
      });

      // Delete related branches
      await prisma.branch.deleteMany({
        where: { projectId: id },
      });
      // Delete related team-project associations
      await prisma.teamProject.deleteMany({
        where: { projectId: id },
      });
    });

    // Delete project
    await prisma.project.delete({
      where: { id },
    });

    // Notify user
    await createNotification(
       session.user.id,
       session.user.email!,
       "Project Deleted",
       `Project "${project.name}" deleted`,
       `Project "${project.name}" and all associated data have been permanently deleted.`,
       "warning"
    );

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
    const { name, description, teamIds, newOwnerEmail, targetWorkspaceId } = body;

    if (!id) {
        return NextResponse.json(
            { error: "Project ID is required" },
            { status: 400 }
        );
    }
    
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
         return NextResponse.json(
            { error: "Project not found" },
            { status: 404 }
        );
    }
    
    // Check Permissions
    // For general updates: Owner or Admin
    // For Transfer (newOwnerEmail) or Move (targetWorkspaceId): Owner ONLY
    
    // Import helper dynamically or use checking logic here
    const { getUserProjectRole } = await import("@/lib/permissions"); // Dynamic import to avoid circular dep if any? No, should be fine.
    
    const role = await getUserProjectRole(session.user.id, id);
    
    if (!role || (role !== "owner" && role !== "admin")) {
         return NextResponse.json({ error: "You do not have permission to update project settings" }, { status: 403 });
    }

    // Strict checks for critical actions
    if (newOwnerEmail || targetWorkspaceId) {
        if (role !== "owner") {
             return NextResponse.json({ error: "Only the project owner can transfer or move the project" }, { status: 403 });
        }
    }
    
    // Update data object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    // Handle Ownership Transfer
    if (newOwnerEmail) {
        const newOwner = await prisma.user.findFirst({
            where: { email: newOwnerEmail }
        });
        
        if (!newOwner) {
             return NextResponse.json(
                { error: "New owner email not found" },
                { status: 404 }
            );
        }
        updateData.userId = newOwner.id;
    }

    // Handle Workspace Transfer
    if (targetWorkspaceId) {
        const workspace = await prisma.workspace.findUnique({
            where: { id: targetWorkspaceId }
        });
         if (!workspace) {
             return NextResponse.json(
                { error: "Target workspace not found" },
                { status: 404 }
            );
        }
        updateData.workspaceId = targetWorkspaceId;
    }

    // Update team associations if provided
    if (teamIds) {
      await prisma.teamProject.deleteMany({
        where: { projectId: id },
      });

      updateData.teamProjects = {
        create: teamIds.map((teamId: string) => ({
          teamId,
        })),
      };
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        branches: true,
        teamProjects: {
          include: {
            team: true,
          },
        },
      },
    });

    // Determine notification type
    let action = "Project Updated";
    let details = `Project "${project.name}" updated.`;
    
    if (newOwnerEmail) {
        action = "Project Transferred";
        details = `Ownership of project "${project.name}" transferred to ${newOwnerEmail}.`;
    } else if (targetWorkspaceId) {
        action = "Project Moved";
        details = `Project "${project.name}" moved to new workspace.`;
    } else if (name && name !== existingProject.name) {
        action = "Project Renamed";
        details = `Project renamed from "${existingProject.name}" to "${name}".`;
    }

    await createNotification(
       session.user.id, 
       session.user.email!,
       action,
       details,
       details, 
       "info"
    );

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
