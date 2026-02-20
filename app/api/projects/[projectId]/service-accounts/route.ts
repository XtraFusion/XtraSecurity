import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = params;

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

    const serviceAccounts = await prisma.serviceAccount.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { apiKeys: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(serviceAccounts);
  } catch (error) {
    console.error("GET service-accounts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = params;
    const body = await req.json();
    const { name, description, permissions } = body;

    // Verify project access (Must be owner or have write permissions - simplified to project access for now)
    // TODO: stricter permission check
    // Verify project access and RBAC
    const { getUserProjectRole } = await import("@/lib/permissions");
    const role = await getUserProjectRole(session.user.id, projectId);

    if (!role) {
         return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // RBAC: Only Owner/Admin can create Service Accounts
    // Developers cannot create SAs (strict security)
    if (role !== "owner" && role !== "admin") {
         return NextResponse.json({ error: "Only project owners and admins can create Service Accounts" }, { status: 403 });
    }



    const serviceAccount = await prisma.serviceAccount.create({
      data: {
        name,
        description,
        permissions: permissions || [],
        projectId,
        createdBy: session.user.id
      }
    });

    return NextResponse.json(serviceAccount, { status: 201 });
  } catch (error) {
    console.error("POST service-accounts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
