import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import crypto from "crypto";
import { hashApiKey } from "@/lib/auth/service-account";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { apiKeys: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  const whereClause: any = { userId: user.id };
  if (workspaceId) {
      whereClause.workspaceId = workspaceId;
  }

  const keys = await prisma.apiKey.findMany({
      where: whereClause
  });

  // Mask keys for security
  const maskedKeys = keys.map((key) => ({
    id: key.id,
    label: key.label,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    lastUsed: key.lastUsed,
    key: key.keyMask || `...${key.key.slice(-4)}`, // Only show mask or fallback to last 4 chars
  }));

  return NextResponse.json(maskedKeys);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { label, workspaceId, expiresAt } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate a secure random key
  const randomPart = crypto.randomBytes(24).toString("hex");
  const fullKey = `xs_${randomPart}`;
  const hash = hashApiKey(fullKey);
  const mask = `xs_...${fullKey.slice(-4)}`;

  const newKey = await prisma.apiKey.create({
    data: {
      key: hash,
      keyMask: mask,
      label: label || "Generated Key",
      userId: user.id,
      workspaceId: workspaceId || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json({
    id: newKey.id,
    label: newKey.label,
    createdAt: newKey.createdAt,
    expiresAt: newKey.expiresAt,
    key: fullKey, // Return full key ONLY here
  });
}
