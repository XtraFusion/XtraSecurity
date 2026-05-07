import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/server-auth";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (auth.isServiceAccount) {
      return NextResponse.json({ error: "Service accounts cannot manage other service accounts" }, { status: 403 });
    }

    const { projectId } = await params;

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
  } catch (error: any) {
    console.error("GET service-accounts error:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (auth.isServiceAccount) {
        return NextResponse.json({ error: "Service accounts cannot manage other service accounts" }, { status: 403 });
    }

    const { projectId } = await params;
    const body = await req.json();
    const { name, description, permissions } = body;

    const { getUserProjectRole } = await import("@/lib/permissions");
    const role = await getUserProjectRole(auth.userId, projectId);

    if (!role) {
         return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // RBAC: Only Owner/Admin can create Service Accounts
    if (role !== "owner" && role !== "admin") {
         return NextResponse.json({ error: "Only project owners and admins can create Service Accounts" }, { status: 403 });
    }

    const serviceAccount = await prisma.serviceAccount.create({
      data: {
        name,
        description,
        permissions: permissions || [],
        projectId,
        createdBy: auth.userId
      }
    });

    try {
      await logAudit(
        "SERVICE_ACCOUNT_CREATED",
        auth.userId,
        projectId,
        { saId: serviceAccount.id, saName: name, permissions }
      );
    } catch (e) {
      console.error("Audit log failed:", e);
    }

    return NextResponse.json(serviceAccount, { status: 201 });
  } catch (error: any) {
    console.error("POST service-accounts error:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
  }
}
