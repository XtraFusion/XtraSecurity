import { NextRequest, NextResponse } from "next/server";
import { verifyAuditChain } from "@/lib/audit";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/audit/verify
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    // Only Admin or specific roles should verify audit logs?
    // For MVP, allow authenticated users.
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verificationResult = await verifyAuditChain();

    if (verificationResult.valid) {
        return NextResponse.json({ 
            valid: true, 
            message: "Audit log chain is intact and verified." 
        });
    } else {
        return NextResponse.json({
            valid: false,
            message: "Audit log chain is broken!",
            details: {
                brokenAtId: verificationResult.brokenAtId,
                reason: verificationResult.reason
            }
        }, { status: 409 }); // 409 Conflict for data integrity issue
    }
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
