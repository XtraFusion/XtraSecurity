import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// DELETE /api/projects/[projectId]/webhooks/[webhookId] - Delete webhook
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; webhookId: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, webhookId } = await params;

    // Verify ownership via project
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        projectId,
        project: { userId: auth.userId }
      }
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    await prisma.webhook.delete({
      where: { id: webhookId }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "webhook_delete",
        entity: "webhook",
        entityId: webhookId,
        changes: { url: webhook.url }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/webhooks/[webhookId]/test - Test webhook
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; webhookId: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, webhookId } = await params;

    const webhook = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        projectId,
        project: { userId: auth.userId }
      }
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Send test payload
    const payload = {
      event: "test",
      timestamp: new Date().toISOString(),
      project: projectId,
      data: {
        message: "This is a test notification from XtraSecurity"
      }
    };

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const success = response.ok;
      return NextResponse.json({ 
        success, 
        status: response.status,
        statusText: response.statusText
      });

    } catch (err: any) {
      return NextResponse.json({ 
        success: false, 
        error: err.message 
      });
    }

  } catch (error: any) {
    console.error("Error testing webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
