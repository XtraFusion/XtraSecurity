import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "25", 10);
    const search = url.searchParams.get("search") || undefined;
    const category = url.searchParams.get("category") || undefined;
    const severity = url.searchParams.get("severity") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const userId = url.searchParams.get("userId") || undefined;
    const workspaceId = url.searchParams.get("workspaceId") || undefined;

    const where: any = {};
    if (category) where.entity = category; // in schema 'entity' maps to e.g., 'auth','project', etc.
    if (severity) where.action = { contains: severity }; // simplistic mapping if severity stored elsewhere
    if (status) where.action = { contains: status }; // placeholder: AuditLog model doesn't have explicit status field
    if (userId) where.userId = userId;
    if (workspaceId) where.workspaceId = workspaceId;
    if (search) where.OR = [{ action: { contains: search } }, { changes: { contains: search } }];

    const total = await prisma.auditLog.count({ where });
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: true },
    });

    return NextResponse.json({ data: logs, total, page, pageSize });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
