import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/server-auth";
import prisma from "@/lib/db";
import { generateApiKey } from "@/lib/auth/service-account";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; saId: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (auth.isServiceAccount) {
      return NextResponse.json({ error: "Service accounts cannot manage other service accounts" }, { status: 403 });
    }

    const { projectId, saId } = await params;
    const body = await req.json();
    const { label, expiresInDays } = body;

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

    const { key, hash, mask } = generateApiKey();
    
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        key: hash,
        label: label || "Generated Key",
        keyMask: mask,
        serviceAccountId: saId,
        expiresAt
      }
    });

    try {
      await logAudit(
        "SERVICE_ACCOUNT_KEY_CREATED",
        auth.userId,
        projectId,
        { saId, keyId: apiKey.id, label: apiKey.label }
      );
    } catch (e) {
      console.error("Audit log failed:", e);
    }

    return NextResponse.json({ 
        id: apiKey.id,
        key: key,
        mask: mask,
        label: apiKey.label,
        expiresAt: apiKey.expiresAt
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST api-keys error:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
  }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string; saId: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { saId } = await params;

    const keys = await prisma.apiKey.findMany({
        where: { serviceAccountId: saId },
        select: {
            id: true,
            label: true,
            lastUsed: true,
            expiresAt: true,
            createdAt: true,
            keyMask: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(keys);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
  }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string; saId: string }> }
) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
