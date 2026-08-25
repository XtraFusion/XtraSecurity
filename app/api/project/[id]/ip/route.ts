import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";
import { getUserProjectRole } from "@/lib/permissions";

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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ipRestrictions: true, name: true, userId: true, workspaceId: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const role = await getUserProjectRole(auth.userId, projectId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden: No access to this project" }, { status: 403 });
    }

    return NextResponse.json({
      projectName: project.name,
      ipRestrictions: project.ipRestrictions || [],
      count: project.ipRestrictions?.length || 0
    });

  } catch (error: any) {
    console.error("Project IP fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const { validateIpAddress, validateDescription } = await import("@/lib/validators");
    const ipCheck = validateIpAddress(ip);
    if (!ipCheck.valid) {
      return NextResponse.json({ error: ipCheck.error }, { status: 400 });
    }

    const descCheck = validateDescription(description, 500);
    if (!descCheck.valid) {
      return NextResponse.json({ error: descCheck.error }, { status: 400 });
    }

    const cleanIp = ipCheck.cleanIp!;
    const cleanDesc = descCheck.cleanDesc || "";

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ipRestrictions: true, workspaceId: true, userId: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const role = await getUserProjectRole(auth.userId, projectId);
    if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden: Only owners and admins can manage IP restrictions" }, { status: 403 });
    }

    // Check if IP already exists
    const existingIps = (project.ipRestrictions || []) as any[];
    if (existingIps.some(r => r.ip === cleanIp)) {
      return NextResponse.json({ error: "IP already in restrictions" }, { status: 400 });
    }

    // Add IP restriction
    const newRestriction = { ip: cleanIp, description: cleanDesc, addedAt: new Date().toISOString() };
    const updatedList = [...existingIps, newRestriction];

    await prisma.project.update({
      where: { id: projectId },
      data: { ipRestrictions: updatedList }
    });

    // Audit log
    await logAudit("PROJECT_IP_ADDED", auth.userId, projectId, { ip: cleanIp, description: cleanDesc }, project.workspaceId || undefined);

    return NextResponse.json({
      success: true,
      message: `IP ${cleanIp} added to project restrictions`,
      ipRestrictions: updatedList
    });

  } catch (error: any) {
    console.error("Project IP add error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ipRestrictions: true, workspaceId: true, userId: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const role = await getUserProjectRole(auth.userId, projectId);
    if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden: Only owners and admins can manage IP restrictions" }, { status: 403 });
    }

    // Remove IP from restrictions
    const existingIps = (project.ipRestrictions || []) as any[];
    const updatedList = existingIps.filter(r => r.ip !== ip);

    await prisma.project.update({
      where: { id: projectId },
      data: { ipRestrictions: updatedList }
    });

    // Audit log
    await logAudit("PROJECT_IP_REMOVED", auth.userId, projectId, { ip }, project.workspaceId || undefined);

    return NextResponse.json({
      success: true,
      message: `IP ${ip} removed from project restrictions`,
      ipRestrictions: updatedList
    });

  } catch (error: any) {
    console.error("Project IP remove error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
