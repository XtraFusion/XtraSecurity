import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import axios from "axios";

async function getTwilioCreds(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "twilio" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const token = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { token, accountSid: cfg?.accountSid, fromNumber: cfg?.fromNumber };
  } catch { return null; }
}

// GET - notification-only
export async function GET() {
  return NextResponse.json({ repos: [] });
}

// POST /api/integrations/twilio/sync - Send SMS
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, message, severity, targetPhone } = await req.json();
    const creds = await getTwilioCreds(auth.userId);
    if (!creds) return NextResponse.json({ error: "Twilio not connected" }, { status: 400 });

    const phone = targetPhone || ""; // User should provide target phone in future config or per event
    if (!phone) return NextResponse.json({ error: "Target phone number missing" }, { status: 400 });

    const authHeader = `Basic ${Buffer.from(`${creds.accountSid}:${creds.token}`).toString("base64")}`;
    const smsBody = `[XtraSecurity] ${severity?.toUpperCase()}: ${title}\n${message}`;

    const params = new URLSearchParams();
    params.append("To", phone);
    params.append("From", creds.fromNumber);
    params.append("Body", smsBody);

    await axios.post(`https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`, params, {
      headers: { "Authorization": authHeader, "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 8000,
    });

    return NextResponse.json({ success: true, summary: { total: 1, synced: 1, failed: 0 }, results: [{ key: "twilio_sms", success: true }] });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
