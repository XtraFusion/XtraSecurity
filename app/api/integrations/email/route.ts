import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";
import nodemailer from "nodemailer";

// GET /api/integrations/email - Status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: auth.userId, provider: "email" } },
      select: { username: true, createdAt: true, config: true },
    });

    if (!integration) return NextResponse.json({ connected: false });
    const cfg = integration.config as any;
    return NextResponse.json({ connected: true, username: integration.username, smtpHost: cfg?.smtpHost, fromEmail: cfg?.fromEmail, connectedAt: integration.createdAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/integrations/email - Connect SMTP
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { smtpHost, smtpPort, username, password, fromEmail, toEmail, secure } = await req.json();
    if (!smtpHost || !smtpPort || !username || !password || !fromEmail || !toEmail) {
      return NextResponse.json({ error: "All SMTP fields are required" }, { status: 400 });
    }

    // Verify connection by sending a test email
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: secure ?? (Number(smtpPort) === 465),
      auth: { user: username, pass: password },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
    });

    try {
      await transporter.verify();

      await transporter.sendMail({
        from: `"XtraSecurity" <${fromEmail}>`,
        to: toEmail,
        subject: "🔐 XtraSecurity Email Alerts Connected",
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
          <h2 style="color:#1a1a2e;margin-top:0">XtraSecurity Connected ✓</h2>
          <p>Your email notification channel is now active. You'll receive alerts for:</p>
          <ul>
            <li>Secret rotations &amp; syncs</li>
            <li>Security anomalies detected</li>
            <li>Access request approvals</li>
          </ul>
          <p style="color:#64748b;font-size:12px;margin-top:24px">Sent by XtraSecurity Platform</p>
        </div>`,
      });
    } catch (e: any) {
      return NextResponse.json({ error: `SMTP verification failed: ${e.message}` }, { status: 401 });
    }

    const encrypted = encrypt(password);
    const label = `${fromEmail} via ${smtpHost}`;

    await prisma.integration.upsert({
      where: { userId_provider: { userId: auth.userId, provider: "email" } },
      create: {
        userId: auth.userId, provider: "email",
        accessToken: JSON.stringify(encrypted),
        username: label, status: "connected", enabled: true,
        config: { smtpHost, smtpPort: Number(smtpPort), username, fromEmail, toEmail, secure: secure ?? (Number(smtpPort) === 465) },
      },
      update: {
        accessToken: JSON.stringify(encrypted),
        username: label, status: "connected", enabled: true,
        config: { smtpHost, smtpPort: Number(smtpPort), username, fromEmail, toEmail, secure: secure ?? (Number(smtpPort) === 465) },
      },
    });

    return NextResponse.json({ connected: true, username: label });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/integrations/email - Disconnect
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.integration.deleteMany({ where: { userId: auth.userId, provider: "email" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
