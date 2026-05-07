import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/server-auth";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; saId: string; keyId: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (auth.isServiceAccount) {
      return NextResponse.json({ error: "Service accounts cannot manage other service accounts" }, { status: 403 });
    }

    const { projectId, saId, keyId } = await params;

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
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify key exists and belongs to this SA
    const apiKey = await prisma.apiKey.findFirst({
        where: { id: keyId, serviceAccountId: saId }
    });

    if (!apiKey) {
        return NextResponse.json({ error: "API Key not found" }, { status: 404 });
    }

    await prisma.apiKey.delete({
        where: { id: keyId }
    });

    try {
      await logAudit(
        "SERVICE_ACCOUNT_KEY_DELETED",
        auth.userId,
        projectId,
        { saId, keyId, label: apiKey.label }
      );
    } catch (e) {
      console.error("Audit log failed:", e);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("DELETE api-key error:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
  }
}
