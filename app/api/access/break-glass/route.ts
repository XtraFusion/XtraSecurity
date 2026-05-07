import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserProjectRole, invalidateUserRbacCache } from "@/lib/permissions";
import { notify } from "@/lib/notifications/engine";
import { verifyAuth } from "@/lib/server-auth";

/**
 * POST /api/access/break-glass
 * Initiates an emergency Break Glass session for 15 minutes.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, reason, incidentId } = await req.json();

    if (!projectId || !reason) {
      return NextResponse.json({ error: "Missing required fields: projectId, reason" }, { status: 400 });
    }

    // 1. Authorization Check: Must be admin or owner
    const role = await getUserProjectRole(auth.userId, projectId);
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only admins or owners can activate break glass." }, { status: 403 });
    }

    // 2. Check for existing active session
    const existingSession = await prisma.breakGlassSession.findFirst({
      where: {
        userId: auth.userId,
        projectId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingSession) {
      return NextResponse.json({ 
        message: "Active Break Glass session already exists", 
        session: existingSession 
      }, { status: 200 });
    }

    // 3. Create Break Glass Session (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const breakGlass = await prisma.breakGlassSession.create({
      data: {
        userId: auth.userId,
        projectId,
        reason,
        incidentId: incidentId || `INC-${Date.now()}`,
        expiresAt,
        isActive: true
      },
      include: {
          project: { select: { name: true, workspaceId: true } }
      }
    });

    // 4. Invalidate Cache so the new permission takes effect immediately
    await invalidateUserRbacCache(auth.userId);

    // 5. Trigger High-Severity Notification to Admins
    try {
      await notify({
        type: "security_alert",
        title: "🚨 BREAK GLASS ACTIVATED",
        message: `${auth.email} activated emergency access for project "${breakGlass.project?.name}"`,
        description: `Reason: ${reason}`,
        severity: "critical",
        workspaceId: breakGlass.project?.workspaceId || "",
        projectId: projectId,
        metadata: { 
            userId: auth.userId, 
            expiresAt: expiresAt.toISOString(),
            incidentId: breakGlass.incidentId
        },
        fields: [
          { label: "User", value: auth.email },
          { label: "Project", value: breakGlass.project?.name || "Unknown" },
          { label: "Reason", value: reason },
          { label: "Expires At", value: expiresAt.toLocaleString() }
        ]
      });
    } catch (nErr) {
      console.error("[BreakGlass] Failed to notify:", nErr);
    }

    // 6. Audit Log
    try {
        await prisma.auditLog.create({
            data: {
                userId: auth.userId,
                action: "break_glass_activated",
                entity: "project",
                entityId: projectId,
                workspaceId: breakGlass.project?.workspaceId,
                changes: {
                    reason,
                    incidentId: breakGlass.incidentId,
                    expiresAt: expiresAt.toISOString()
                }
            }
        });
    } catch (aErr) {
        console.error("[BreakGlass] Failed to log audit:", aErr);
    }

    return NextResponse.json({
      success: true,
      message: "Break Glass session activated. You have full access for 15 minutes.",
      expiresAt: expiresAt.toISOString()
    });

  } catch (error: any) {
    console.error("Break Glass activation failed:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/access/break-glass
 * Deactivates an active Break Glass session.
 */
export async function PATCH(req: NextRequest) {
    try {
      const auth = await verifyAuth(req);
      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const { projectId } = await req.json();
  
      const breakGlass = await prisma.breakGlassSession.updateMany({
        where: {
          userId: auth.userId,
          projectId,
          isActive: true
        },
        data: {
          isActive: false,
          endedAt: new Date()
        }
      });
  
      await invalidateUserRbacCache(auth.userId);
  
      return NextResponse.json({ success: true, message: "Break Glass session ended." });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/access/break-glass
 * Logs activity (commands/input) during a Break Glass session.
 */
export async function PUT(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    
        const { projectId, command, output, metadata } = await req.json();
    
        // Check if there's an active session
        const activeSession = await prisma.breakGlassSession.findFirst({
            where: {
                userId: auth.userId,
                projectId,
                isActive: true,
                expiresAt: { gt: new Date() }
            }
        });

        if (!activeSession) {
            return NextResponse.json({ error: "No active Break Glass session found" }, { status: 403 });
        }

        // Log the activity to SecurityEvent
        await prisma.securityEvent.create({
            data: {
                eventId: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: auth.userId,
                userEmail: auth.email,
                projectId,
                method: "COMMAND",
                endpoint: "CLI",
                statusCode: 200,
                duration: 0,
                isAnomaly: false,
                riskFactors: ["break_glass_activity"],
                queryParams: {
                    command,
                    metadata,
                    sessionId: activeSession.id
                },
                errorMessage: output // We'll store output here for now
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
