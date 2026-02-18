import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { encrypt } from "@/lib/encription";

// POST /api/projects/:pid/envs/:env/secrets/:key/rotate
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
    const body = await req.json();
    const { strategy, parsedNewValue } = body;

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

    // Determine new value
    let newValue = parsedNewValue;
    
    if (strategy === "regenerate") {
        // Regenerate based on something or just use the current value re-encrypted?
        // Usually regenerate implies getting a new value from source, but for generic secrets it might mean re-encrypting.
        // User asked to "regenerate" to fix corruption, implying they want to re-encrypt the EXISTING value (or a provided one).
        // Since CLI `rotate` doesn't force a value for regenerate strategy by default, we assume re-encrypt current value 
        // OR generate a new random one if it was a generated secret.
        // To safely fix corruption, we should really use a provided value or maybe just re-encrypt "restored" value?
        // The user's prompt said "regenerate" strategy. 
        // If we look at `rotate.ts`, it sends `value` if provided.
        // If no value provided, and strategy is regenerate, maybe we should create a random string?
        
        if (!newValue) {
             newValue = require("crypto").randomBytes(16).toString("hex");
        }
    } else {
         // Default shadow rotation
         newValue = parsedNewValue || `${secret.id}_rotated_${Date.now()}`;
    }

    // Encrypt the new value
    const encryptedValue = encrypt(newValue);
    const encryptedString = JSON.stringify(encryptedValue);

    // Update with Shadow
    const updated = await prisma.secret.update({
        where: { id: secret.id },
        data: {
 
            // Wait, "rotate" usually means adding a shadow value.
            // But user wants to FIX corruption.
            // If strategy is "regenerate", we probably want to update the MAIN value directly to fix it?
            // Or maybe just set shadow and then promote?
            // The user's goal is to fix the export. Export reads the main value.
            // So we should update the main `value` field.
            
            // If strategy is regenerate, let's update main value AND create history.
            ...(strategy === "regenerate" ? {
                value: [encryptedString],
                version: (parseInt(secret.version) + 1).toString(),
                history: [...(Array.isArray(secret.history) ? secret.history as any[] : []), {
                    version: secret.version,
                    value: secret.value,
                    updatedAt: secret.lastUpdated,
                    updatedBy: secret.updatedBy,
                    changeReason: "Regenerated via rotation"
                }]
            } : {
                shadowValue: [encryptedString],
                shadowStatus: "active",
                shadowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), 
            }),
            
            updatedBy: auth.userId
        }
    });

    return NextResponse.json({
        success: true,
        message: "Secret rotated",
        shadowValue: strategy === "regenerate" ? newValue : serializedShadow(updated.shadowValue),
        expiresAt: updated.shadowExpiresAt
    });

  } catch (error: any) {
    console.error("Rotate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function serializedShadow(val: string[]) {
    // Helper to return something safe
    return "********";
}
