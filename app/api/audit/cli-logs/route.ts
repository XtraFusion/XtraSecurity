import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withSecurity } from "@/lib/api-middleware";

export const dynamic = 'force-dynamic';

export const POST = withSecurity(async (req: NextRequest, _context: any, auth: any) => {
  // Resolve a real MongoDB ObjectId userId.
  let userId = auth.userId;
  if (auth.isServiceAccount && auth.projectId) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: auth.projectId },
        select: { userId: true },
      });
      if (project?.userId) userId = project.userId;
    } catch (_) { /* leave userId as-is */ }
  }

  // If userId is still not a plain ObjectId (e.g. still prefixed), bail gracefully.
  const isValidObjectId = /^[a-f\d]{24}$/i.test(userId ?? "");
  if (!isValidObjectId) {
    return NextResponse.json({ success: true, count: 0, note: "Service account logs skipped (no resolvable user)." });
  }

  // 2. Parse Logs
  const body = await req.json();
  const logs = body.logs; 

  // Extract Network Metadata
  const ip = (req.headers.get("x-forwarded-for") ?? "127.0.0.1").split(',')[0];
  const userAgent = req.headers.get("user-agent") || "XtraSec CLI";

  if (!Array.isArray(logs)) {
      return NextResponse.json({ error: "Invalid format. Expected 'logs' array." }, { status: 400 });
  }

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
          // Ignore error
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
          ipAddress: ip,
          userAgent: userAgent,
      });

      previousHash = currentHash;
  }

  await prisma.auditLog.createMany({
      data: auditEntries
  });

  return NextResponse.json({ success: true, count: auditEntries.length });
});
