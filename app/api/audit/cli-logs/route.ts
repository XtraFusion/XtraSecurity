import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Authentication
  const auth = await verifyAuth(req);
  if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = auth.userId;

  // 2. Parse Logs
  const body = await req.json();
  const logs = body.logs; 

  if (!Array.isArray(logs)) {
      return NextResponse.json({ error: "Invalid format. Expected 'logs' array." }, { status: 400 });
  }

  let count = 0;

  // 3. Chain & Insert Logs (Tamper-Evident)
  const { createHash } = require("crypto");
  
  // Fetch latest log for chaining
  const lastLog = await prisma.auditLog.findFirst({
      orderBy: { timestamp: "desc" }
  });
  
  let previousHash = lastLog?.currentHash || "0000000000000000000000000000000000000000000000000000000000000000";

  const auditEntries = [];

  for (const log of logs) {
      const timestamp = new Date(log.timestamp);
      
      // Determine workspaceId from projectId if not provided
      let workspaceId = log.workspaceId;
      if (!workspaceId && log.projectId) {
        try {
          const project = await prisma.project.findUnique({
            where: { id: log.projectId },
            select: { workspaceId: true }
          });
          if (project) {
            workspaceId = project.workspaceId;
          }
        } catch (e) {
          // Ignore error, workspaceId will remain undefined
        }
      }
      
      // Construct payload for hash
      const payload = [
        previousHash,
        timestamp.toISOString(),
        log.action,
        userId!,
        log.entityId || log.projectId || "global",
        JSON.stringify(log.details || {})
      ].join("|");

      const currentHash = createHash("sha256").update(payload).digest("hex");

      auditEntries.push({
          userId: userId!,
          action: log.action,
          entity: log.entity || "cli-project",
          entityId: log.entityId || log.projectId || "global",
          changes: log.details || {},
          timestamp: timestamp,
          previousHash: previousHash,
          currentHash: currentHash,
          workspaceId: workspaceId || null,
      });

      previousHash = currentHash;
  }

  try {
      await prisma.auditLog.createMany({
          data: auditEntries
      });
      count = auditEntries.length;
  } catch (error: any) {
      console.error("Failed to insert audit logs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count });
}
