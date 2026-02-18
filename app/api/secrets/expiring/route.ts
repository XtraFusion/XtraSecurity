import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/secrets/expiring - List secrets expiring within N days
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "7");
    const projectId = url.searchParams.get("projectId");

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    // Build query
    const whereClause: any = {
      expiryDate: {
        lte: futureDate,
        gte: new Date() // Not already expired
      },
      project: {
        userId: auth.userId
      }
    };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const expiringSecrets = await prisma.secret.findMany({
      where: whereClause,
      select: {
        id: true,
        key: true,
        environmentType: true,
        expiryDate: true,
        projectId: true,
        project: {
          select: { name: true }
        }
      },
      orderBy: { expiryDate: "asc" }
    });

    // Also get expired secrets
    const expiredSecrets = await prisma.secret.findMany({
      where: {
        expiryDate: { lt: new Date() },
        project: { userId: auth.userId },
        ...(projectId && { projectId })
      },
      select: {
        id: true,
        key: true,
        environmentType: true,
        expiryDate: true,
        projectId: true,
        project: {
          select: { name: true }
        }
      },
      orderBy: { expiryDate: "asc" }
    });

    return NextResponse.json({
      expiring: expiringSecrets.map(s => ({
        ...s,
        daysUntilExpiry: Math.ceil((new Date(s.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        status: "expiring"
      })),
      expired: expiredSecrets.map(s => ({
        ...s,
        daysExpired: Math.ceil((Date.now() - new Date(s.expiryDate!).getTime()) / (1000 * 60 * 60 * 24)),
        status: "expired"
      })),
      summary: {
        expiringCount: expiringSecrets.length,
        expiredCount: expiredSecrets.length,
        total: expiringSecrets.length + expiredSecrets.length
      }
    });

  } catch (error: any) {
    console.error("Error fetching expiring secrets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
