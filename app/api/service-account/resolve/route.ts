import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

/**
 * GET /api/service-account/resolve
 * Dedicated endpoint for CLI auto-detection.
 * Verifies the token and returns the linked project details.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await verifyAuth(req);

    if (!session || !session.isServiceAccount || !session.serviceAccountId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "A valid Service Account token is required." 
      }, { status: 401 });
    }

    const sa = await prisma.serviceAccount.findUnique({
      where: { id: session.serviceAccountId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            workspaceId: true
          }
        }
      }
    });

    if (!sa || !sa.project) {
      return NextResponse.json({ 
        error: "Not Found", 
        message: "Service Account is not linked to a valid project." 
      }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      serviceAccount: {
        id: sa.id,
        name: sa.name,
        permissions: sa.permissions
      },
      project: {
        id: sa.project.id,
        name: sa.project.name,
        workspaceId: sa.project.workspaceId
      }
    });
  } catch (error: any) {
    console.error("[SA Resolve Error]:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error.message 
    }, { status: 500 });
  }
}
