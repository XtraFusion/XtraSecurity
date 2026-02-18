import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// POST /api/projects/:pid/envs/:env/secrets/:key/promote
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; env: string; key: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, env, key } = params;

    const secret = await prisma.secret.findFirst({
      where: {
        projectId,
        environmentType: env,
        key: key
      }
    });

    if (!secret) {
        return NextResponse.json({ error: "Secret not found" }, { status: 404 });
    }

    if (secret.shadowStatus !== "active" || !secret.shadowValue || secret.shadowValue.length === 0) {
        return NextResponse.json({ error: "No active shadow value to promote" }, { status: 400 });
    }

    // Promote
    const oldVersion = secret.version;
    const newVersion = (parseInt(oldVersion || "0") + 1).toString();
    
    // Archive old value
    const historyEntry = {
        version: oldVersion,
        value: secret.value,
        updatedAt: secret.lastUpdated,
        updatedBy: secret.updatedBy
    };

    const currentHistory = Array.isArray(secret.history) ? secret.history : [];

    const updated = await prisma.secret.update({
        where: { id: secret.id },
        data: {
            value: secret.shadowValue, // Promote shadow
            version: newVersion,
            
            // Clear shadow
            shadowValue: [],
            shadowStatus: null,
            shadowExpiresAt: null,

            history: [...currentHistory, historyEntry],
            updatedBy: auth.userId
        }
    });

    return NextResponse.json({
        success: true,
        message: "Secret promoted successfully",
        version: newVersion
    });

  } catch (error: any) {
    console.error("Promote error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
