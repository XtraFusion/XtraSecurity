import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import axios from "axios";

// GET /api/integrations/twilio - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "twilio" } },
      select: { username: true, createdAt: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, username: integration.username, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/twilio - Connect
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { accountSid, authToken, fromNumber } = await req.json();
    if (!accountSid || !authToken || !fromNumber) return NextResponse.json({ error: "All Twilio fields are required" }, { status: 400 });

    const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;

    try {
      // Validate by fetching account details
      const res = await axios.get(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, { 
        headers: { "Authorization": authHeader },
        timeout: 8000 
      });
      
      const username = res.data?.friendly_name || accountSid;
      const encryptedAuthToken = encrypt(authToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId: auth.userId, provider: "twilio" } },
        create: { userId: auth.userId, provider: "twilio", accessToken: JSON.stringify(encryptedAuthToken), username, status: "connected", enabled: true, config: { accountSid, fromNumber } },
        update: { accessToken: JSON.stringify(encryptedAuthToken), username, status: "connected", enabled: true, config: { accountSid, fromNumber } },
      });

      return NextResponse.json({ connected: true, username });
    } catch (e: any) {
      return NextResponse.json({ error: "Twilio verification failed. Check SID and Auth Token." }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/twilio
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "twilio" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
