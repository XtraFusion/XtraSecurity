import { NextRequest, NextResponse } from "next/server";
import { sendSlackNotification } from "@/lib/notifications/slack";
import { sendTeamsNotification } from "@/lib/notifications/teams";
import { sendWebhookNotification } from "@/lib/notifications/webhook";
import { verifyAuth } from "@/lib/server-auth";

// POST /api/notification-channels/test - Send a test message to a webhook
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { webhookUrl, type = "slack" } = await req.json();

  if (!webhookUrl) {
    return NextResponse.json({ error: "webhookUrl is required" }, { status: 400 });
  }

  const testPayload = {
    title: "XtraSecurity Test Notification",
    message: `Your ${type} channel is connected successfully! 🎉`,
    description: "You will now receive alerts here for security events, team updates, and more.",
    type: "success" as const,
    fields: [
      { label: "Connected by", value: auth.email || "Unknown" },
      { label: "Platform", value: "XtraSecurity" },
    ],
    timestamp: new Date().toISOString(),
    platform: "XtraSecurity",
  };

  if (type === "slack") {
    const result = await sendSlackNotification(webhookUrl, testPayload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Test message sent to Slack!" });
  }

  if (type === "teams") {
    const result = await sendTeamsNotification(webhookUrl, testPayload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Test message sent to Microsoft Teams!" });
  }

  if (type === "webhook") {
    const result = await sendWebhookNotification(webhookUrl, testPayload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Test message sent to Webhook!" });
  }

  return NextResponse.json({ error: "Unsupported channel type" }, { status: 400 });
}
