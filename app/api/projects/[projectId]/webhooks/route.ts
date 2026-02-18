import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/projects/[projectId]/webhooks - List webhooks
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const webhooks = await prisma.webhook.findMany({
      where: {
        projectId,
        project: { userId: auth.userId }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(webhooks);

  } catch (error: any) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/webhooks - Create webhook
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const { url, events, active } = await req.json();

    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: "URL and events are required" }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: auth.userId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const webhook = await prisma.webhook.create({
      data: {
        projectId,
        url,
        events,
        active: active ?? true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "webhook_create",
        entity: "webhook",
        entityId: webhook.id,
        changes: { url, events }
      }
    });

    return NextResponse.json(webhook, { status: 201 });

  } catch (error: any) {
    console.error("Error creating webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
