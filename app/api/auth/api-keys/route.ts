import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import crypto from "crypto";

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
    lastUsed: key.lastUsed,
    key: `...${key.key.slice(-4)}`, // Only show last 4 chars
  }));

  return NextResponse.json(maskedKeys);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { label, workspaceId } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate a secure random key
  const randomPart = crypto.randomBytes(24).toString("hex");
  const fullKey = `xs_${randomPart}`;

  // Store it (in a real app, you might hash this, but we'll store specific keys for this MVP or hash)
  // For this implementation we will store it plainly to match the CLI login expectation which matches directly.
  // In production: store hash(fullKey), return fullKey only now.
  
  const newKey = await prisma.apiKey.create({
    data: {
      key: fullKey,
      label: label || "Generated Key",
      userId: user.id,
      workspaceId: workspaceId || null,
    },
  });

  return NextResponse.json({
    id: newKey.id,
    label: newKey.label,
    createdAt: newKey.createdAt,
    key: fullKey, // Return full key ONLY here
  });
}
