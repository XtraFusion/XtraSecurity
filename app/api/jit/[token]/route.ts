import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/jit/[token] — Get JIT link metadata (for claim page)
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized — please log in" }, { status: 401 });
    }

    const { token } = params;

    const jitLink = await prisma.jitLink.findUnique({
      where: { token },
    });

    if (!jitLink) {
      return NextResponse.json({ error: "JIT link not found" }, { status: 404 });
    }

    // Check expiry
    if (new Date() > jitLink.expiresAt) {
      return NextResponse.json({
        error: "This JIT link has expired",
        expired: true,
      }, { status: 410 });
    }

    // Check revoked
    if (jitLink.isRevoked) {
      return NextResponse.json({
        error: "This JIT link has been revoked",
        revoked: true,
      }, { status: 410 });
    }

    // Check max uses
    if (jitLink.usedCount >= jitLink.maxUses) {
      return NextResponse.json({
        error: "This JIT link has reached its usage limit",
        exhausted: true,
      }, { status: 410 });
    }

    // Fetch project info
    const project = await prisma.project.findUnique({
      where: { id: jitLink.projectId },
      select: { name: true, id: true },
    });

    // Fetch branch info if scoped
    let branchName = null;
    if (jitLink.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: jitLink.branchId },
        select: { name: true },
      });
      branchName = branch?.name || null;
    }

    // Fetch secret keys if scoped
    let secretKeys: string[] = [];
    if (jitLink.secretIds && jitLink.secretIds.length > 0) {
      const secrets = await prisma.secret.findMany({
        where: { id: { in: jitLink.secretIds } },
        select: { key: true },
      });
      secretKeys = secrets.map((s) => s.key);
    }

    // Fetch creator info
    const creator = await prisma.user.findUnique({
      where: { id: jitLink.createdBy },
      select: { name: true, email: true },
    });

    return NextResponse.json({
      token: jitLink.token,
      projectName: project?.name || "Unknown Project",
      projectId: jitLink.projectId,
      branchName,
      branchId: jitLink.branchId,
      environment: jitLink.environment,
      secretKeys,
      secretIds: jitLink.secretIds,
      duration: jitLink.duration,
      label: jitLink.label,
      accessLevel: jitLink.accessLevel,
      expiresAt: jitLink.expiresAt,
      maxUses: jitLink.maxUses,
      usedCount: jitLink.usedCount,
      createdBy: creator?.name || creator?.email || "Unknown",
      createdAt: jitLink.createdAt,
    });
  } catch (error: any) {
    console.error("JIT info error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
