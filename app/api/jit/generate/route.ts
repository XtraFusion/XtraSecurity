import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import crypto from "crypto";


// POST /api/jit/generate — Create a JIT link
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pro plan check — JIT is not available on free tier
    const creator = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true },
    });
    if (!creator || (creator.tier || "free") === "free") {
      return NextResponse.json(
        { error: "JIT Access Links are a Pro feature. Please upgrade your plan." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      projectId,
      branchId,
      environment,
      secretIds,
      duration,
      label,
      maxUses,
      expiresInHours,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (!duration || duration < 1) {
      return NextResponse.json({ error: "duration must be at least 1 minute" }, { status: 400 });
    }

    // Verify project exists and user has admin/developer access
    const { getUserProjectRole } = await import("@/lib/permissions");
    const role = await getUserProjectRole(auth.userId, projectId);

    if (!role || (role !== "owner" && role !== "admin" && role !== "developer")) {
      return NextResponse.json(
        { error: "Only admins and developers can generate JIT links" },
        { status: 403 }
      );
    }

    // Fetch project workspaceId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(24).toString("hex");

    // Calculate link expiry (default 24 hours)
    const linkExpiryHours = expiresInHours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + linkExpiryHours);

    const jitLink = await prisma.jitLink.create({
      data: {
        token,
        projectId,
        branchId: branchId || null,
        environment: environment || null,
        secretIds: secretIds || [],
        createdBy: auth.userId,
        duration: Number(duration),
        label: label || null,
        expiresAt,
        maxUses: maxUses || 1,
        accessLevel: "read",
        workspaceId: project.workspaceId,
      },
    });

    // Build the shareable URL
    const baseUrl = req.headers.get("origin") || req.headers.get("host") || "http://localhost:3000";
    const protocol = baseUrl.startsWith("http") ? "" : "https://";
    const url = `${protocol}${baseUrl}/jit/${token}`;
    const cliCommand = `xtra access jit ${token}`;

    return NextResponse.json({
      token: jitLink.token,
      url,
      cliCommand,
      expiresAt: jitLink.expiresAt,
      duration: jitLink.duration,
      accessLevel: jitLink.accessLevel,
    });
  } catch (error: any) {
    console.error("JIT generate error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
