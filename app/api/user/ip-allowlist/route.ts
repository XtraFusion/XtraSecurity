import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

// GET /api/user/ip-allowlist - Get user's IP allowlist
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { ipAllowlist: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ipAllowlist: user.ipAllowlist || [],
      count: user.ipAllowlist?.length || 0
    });

  } catch (error: any) {
    console.error("IP allowlist fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/user/ip-allowlist - Add IP to allowlist
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ip, description } = await req.json();

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 });
    }

    // Validate IP format (basic check)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^\*$|^(\d{1,3}\.){0,3}\*$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: "Invalid IP format" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { ipAllowlist: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if IP already exists
    if (user.ipAllowlist?.includes(ip)) {
      return NextResponse.json({ error: "IP already in allowlist" }, { status: 400 });
    }

    // Add IP to allowlist
    const updatedList = [...(user.ipAllowlist || []), ip];

    await prisma.user.update({
      where: { id: auth.userId },
      data: { ipAllowlist: updatedList }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "ip_allowlist_add",
        entity: "user",
        entityId: auth.userId,
        changes: { ip, description }
      }
    });

    return NextResponse.json({
      success: true,
      message: `IP ${ip} added to allowlist`,
      ipAllowlist: updatedList
    });

  } catch (error: any) {
    console.error("IP allowlist add error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/user/ip-allowlist - Remove IP from allowlist
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ip } = await req.json();

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { ipAllowlist: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove IP from allowlist
    const updatedList = (user.ipAllowlist || []).filter(i => i !== ip);

    await prisma.user.update({
      where: { id: auth.userId },
      data: { ipAllowlist: updatedList }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        action: "ip_allowlist_remove",
        entity: "user",
        entityId: auth.userId,
        changes: { ip }
      }
    });

    return NextResponse.json({
      success: true,
      message: `IP ${ip} removed from allowlist`,
      ipAllowlist: updatedList
    });

  } catch (error: any) {
    console.error("IP allowlist remove error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
