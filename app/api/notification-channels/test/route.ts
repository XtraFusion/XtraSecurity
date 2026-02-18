import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendSlackNotification } from "@/lib/notifications/slack";

// POST /api/notification-channels/test - Send a test message to a webhook
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { webhookUrl, type = "slack" } = await req.json();

  if (!webhookUrl) {
    return NextResponse.json({ error: "webhookUrl is required" }, { status: 400 });
  }

  if (type === "slack") {
    const result = await sendSlackNotification(webhookUrl, {
      title: "XtraSecurity Test Notification",
      message: "Your Slack channel is connected successfully! 🎉",
      description: "You will now receive alerts here for team events, role changes, and more.",
      type: "success",
      fields: [
        { label: "Connected by", value: session.user.email || "Unknown" },
        { label: "Platform", value: "XtraSecurity" },
      ],
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Test message sent to Slack!" });
  }

  return NextResponse.json({ error: "Unsupported channel type" }, { status: 400 });
}
