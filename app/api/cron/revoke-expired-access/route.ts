import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/cron/revoke-expired-access -> Revoke expired access requests
// This should be protected by a cron secret in production
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const expiredRequests = await prisma.accessRequest.findMany({
      where: {
        status: "approved",
        expiresAt: {
          lt: now,
        },
      },
    });
 
    let revokedCount = 0;
 
    for (const request of expiredRequests) {
      if (request.secretIds && request.secretIds.length > 0) {
        for (const secretId of request.secretIds) {
          const secret = await prisma.secret.findUnique({ where: { id: secretId } });
          if (secret) {
            const currentPermissions = secret.permission || [];
            const newPermissions = currentPermissions.filter((uid) => uid !== request.userId);
 
            if (currentPermissions.length !== newPermissions.length) {
              await prisma.secret.update({
                where: { id: secretId },
                data: {
                  permission: newPermissions,
                },
              });
            }
          }
        }
      }
 
      // Update request status to expired
      await prisma.accessRequest.update({
        where: { id: request.id },
        data: {
          status: "expired",
        },
      });
 
      revokedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Revoked ${revokedCount} expired access requests`,
      processed: expiredRequests.length,
    });
  } catch (error) {
    console.error("Failed to revoke expired access:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
