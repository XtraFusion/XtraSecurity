import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/project/[id]/ip - Get project IP restrictions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.userId
      },
      select: { ipRestrictions: true, name: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      projectName: project.name,
      ipRestrictions: project.ipRestrictions || [],
      count: project.ipRestrictions?.length || 0
    });

  } catch (error: any) {
    console.error("Project IP fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/project/[id]/ip - Add IP restriction to project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { ip, description } = await req.json();

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.userId
      },
      select: { ipRestrictions: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if IP already exists
    const existingIps = (project.ipRestrictions || []) as any[];
    if (existingIps.some(r => r.ip === ip)) {
      return NextResponse.json({ error: "IP already in restrictions" }, { status: 400 });
    }

    // Add IP restriction
    const newRestriction = { ip, description: description || "", addedAt: new Date().toISOString() };
    const updatedList = [...existingIps, newRestriction];

    await prisma.project.update({
      where: { id: projectId },
      data: { ipRestrictions: updatedList }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "project_ip_add",
        entity: "project",
        entityId: projectId,
        changes: { ip, description }
      }
    });

    return NextResponse.json({
      success: true,
      message: `IP ${ip} added to project restrictions`,
      ipRestrictions: updatedList
    });

  } catch (error: any) {
    console.error("Project IP add error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/project/[id]/ip - Remove IP restriction from project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { ip } = await req.json();

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.userId
      },
      select: { ipRestrictions: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Remove IP from restrictions
    const existingIps = (project.ipRestrictions || []) as any[];
    const updatedList = existingIps.filter(r => r.ip !== ip);

    await prisma.project.update({
      where: { id: projectId },
      data: { ipRestrictions: updatedList }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "project_ip_remove",
        entity: "project",
        entityId: projectId,
        changes: { ip }
      }
    });

    return NextResponse.json({
      success: true,
      message: `IP ${ip} removed from project restrictions`,
      ipRestrictions: updatedList
    });

  } catch (error: any) {
    console.error("Project IP remove error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
