import { NextRequest, NextResponse } from "next/server";
import { hashApiKey } from "@/lib/auth/service-account";
import prisma from "@/lib/db";

/**
 * DEBUG ENDPOINT: Test API Key Hash
 * 
 * Usage:
 * curl -X POST http://localhost:3000/api/debug/test-api-key \
 *   -H "Content-Type: application/json" \
 *   -d '{"apiKey":"xtra_c2230e8c2c0f7204a8a7e7b883f575c31c6bff4254c533a22bd85883cee06f00"}'
 */

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
    }

    // Hash the incoming key
    const hash = hashApiKey(apiKey);

    // Try to find it
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: hash },
      include: {
        user: { select: { email: true } },
        serviceAccount: { select: { name: true, projectId: true } }
      }
    });

    // Also get all API keys to see what's in the database
    const allKeys = await prisma.apiKey.findMany({
      select: { 
        id: true,
        key: true,
        keyMask: true,
        label: true,
        userId: true,
        serviceAccountId: true
      },
      take: 10
    });

    return NextResponse.json({
      debug: {
        incomingKey: `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 4)}`,
        calculatedHash: `${hash.substring(0, 15)}...${hash.substring(hash.length - 4)}`,
        keyFound: !!keyRecord,
        keyDetails: keyRecord ? {
          id: keyRecord.id,
          user: keyRecord.user?.email,
          serviceAccount: keyRecord.serviceAccount?.name,
          projectId: keyRecord.serviceAccount?.projectId
        } : null
      },
      allKeysInDatabase: {
        count: allKeys.length,
        keys: allKeys.map(k => ({
          id: k.id,
          hash: `${k.key.substring(0, 15)}...${k.key.substring(k.key.length - 4)}`,
          mask: k.keyMask,
          label: k.label,
          userId: k.userId,
          serviceAccountId: k.serviceAccountId
        }))
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
