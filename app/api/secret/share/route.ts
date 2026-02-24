import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";
import { randomBytes } from "crypto";

// POST /api/secret/share — Create a time-limited share link
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { secretId, expiresInHours = 24, maxViews = null, label = "" } = body;

  if (!secretId) return NextResponse.json({ error: "secretId is required" }, { status: 400 });

  // Verify the secret belongs to a project the user has access to
  const secret = await prisma.secret.findUnique({ where: { id: secretId }, include: { project: true } });
  if (!secret) return NextResponse.json({ error: "Secret not found" }, { status: 404 });

  // Generate a cryptographically secure random token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  const share = await prisma.secretShare.create({
    data: {
      secretId,
      token,
      createdBy: auth.userId,
      expiresAt,
      maxViews: maxViews ? parseInt(maxViews) : null,
      label: label || null,
    },
  });

  const shareUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/share/${token}`;

  return NextResponse.json({ shareUrl, token, expiresAt, id: share.id }, { status: 201 });
}

// GET /api/secret/share?token=xxx — View a shared secret (public endpoint)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token is required" }, { status: 400 });

  const share = await prisma.secretShare.findUnique({
    where: { token },
    include: { secret: true },
  });

  if (!share) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  if (share.isRevoked) return NextResponse.json({ error: "This link has been revoked" }, { status: 410 });
  if (share.expiresAt < new Date()) return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  if (share.maxViews !== null && share.viewCount >= share.maxViews) {
    return NextResponse.json({ error: "This link has reached its view limit" }, { status: 410 });
  }

  // Decrypt the secret value
  let decryptedValue = "[Decryption failed]";
  try {
    const encryptedString = share.secret.value[0];
    const encryptedObject = JSON.parse(encryptedString);
    decryptedValue = decrypt(encryptedObject);
  } catch (e) {
    console.error("Failed to decrypt shared secret:", e);
  }

  // Increment view count
  await prisma.secretShare.update({
    where: { id: share.id },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json({
    key: share.secret.key,
    value: decryptedValue,
    environmentType: share.secret.environmentType,
    label: share.label,
    viewCount: share.viewCount + 1,
    maxViews: share.maxViews,
    expiresAt: share.expiresAt,
  });
}

// DELETE /api/secret/share?id=xxx — Revoke a share link
export async function DELETE(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Share ID is required" }, { status: 400 });

  const share = await prisma.secretShare.findUnique({ where: { id } });
  if (!share) return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  if (share.createdBy !== auth.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.secretShare.update({ where: { id }, data: { isRevoked: true } });

  return NextResponse.json({ success: true });
}
