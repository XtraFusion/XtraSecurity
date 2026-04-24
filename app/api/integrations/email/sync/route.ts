import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import nodemailer from "nodemailer";

async function getEmailConfig(userId: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "email" } },
  });
  if (!integration?.accessToken) return null;
  try {
    const password = decrypt(JSON.parse(integration.accessToken));
    const cfg = integration.config as any;
    return { password, ...cfg } as { password: string; smtpHost: string; smtpPort: number; username: string; fromEmail: string; toEmail: string; secure: boolean };
  } catch { return null; }
}

// GET - notification-only, no repos
export async function GET() {
  return NextResponse.json({ repos: [] });
}

// POST /api/integrations/email/sync - Send alert email
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, message, severity } = await req.json();
    const cfg = await getEmailConfig(auth.userId);
    if (!cfg) return NextResponse.json({ error: "Email not connected" }, { status: 400 });

    const severityColor: Record<string, string> = { critical: "#dc2626", error: "#ea580c", warning: "#d97706", info: "#2563eb" };
    const color = severityColor[severity] || "#2563eb";
    const severityBg: Record<string, string> = { critical: "#fef2f2", error: "#fff7ed", warning: "#fffbeb", info: "#eff6ff" };
    const bg = severityBg[severity] || "#eff6ff";

    const transporter = nodemailer.createTransport({
      host: cfg.smtpHost, port: cfg.smtpPort, secure: cfg.secure,
      auth: { user: cfg.username, pass: cfg.password },
      connectionTimeout: 8000,
    });

    await transporter.sendMail({
      from: `"XtraSecurity Alerts" <${cfg.fromEmail}>`,
      to: cfg.toEmail,
      subject: `🔐 ${title || "XtraSecurity Alert"}`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        <div style="background:${color};padding:16px 24px">
          <h2 style="color:#fff;margin:0;font-size:16px">${title || "Security Alert"}</h2>
        </div>
        <div style="background:${bg};padding:20px 24px">
          <p style="margin:0;color:#1e293b;font-size:14px;line-height:1.6">${message || ""}</p>
        </div>
        <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0">
          <p style="margin:0;color:#64748b;font-size:11px">Sent by <strong>XtraSecurity Platform</strong> &middot; Severity: <strong style="color:${color}">${severity?.toUpperCase() || "INFO"}</strong></p>
        </div>
      </div>`,
    });

    return NextResponse.json({ success: true, summary: { total: 1, synced: 1, failed: 0 }, results: [{ key: "email", success: true }] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
