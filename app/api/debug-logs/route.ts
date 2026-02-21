import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wid = url.searchParams.get("workspaceId");
  
  const allLogs = await prisma.auditLog.findMany({
    where: wid ? { workspaceId: wid } : undefined
  });
  
  const grouped = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: wid ? { workspaceId: wid } : undefined,
    _count: { userId: true }
  });
  
  return NextResponse.json({
    count: allLogs.length,
    grouped,
    logs: allLogs
  });
}
