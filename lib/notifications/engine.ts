/**
 * Notification Rules Engine
 * Evaluates a security or system event against defined NotificationRules
 * and dispatches to the matched channels.
 */

import prisma from "@/lib/db";
import { dispatchNotification } from "./dispatch";

export interface NotificationEvent {
  type: "secret_change" | "rotation_failed" | "suspicious_activity" | "access_denied" | "system_error";
  title: string;
  message: string;
  description?: string;
  severity: "info" | "warning" | "error" | "critical";
  workspaceId: string;
  projectId?: string;
  branch?: string;
  metadata?: Record<string, any>;
  fields?: { label: string; value: string }[];
}

/**
 * Main entry point: Process an event and notify relevant channels
 */
export async function notify(event: NotificationEvent): Promise<void> {
  try {
    // 1. Fetch all enabled rules for this workspace
    const rules = await prisma.notificationRule.findMany({
      where: {
        workspaceId: event.workspaceId,
        enabled: true,
      },
    });

    if (!rules || rules.length === 0) {
      console.log(`[Engine] No enabled rules found for workspace ${event.workspaceId}`);
      return;
    }

    // 2. Filter rules that match this event
    const matchingRules = rules.filter((rule) => {
      // a. Check Trigger
      if (!rule.triggers.includes(event.type)) return false;

      // b. Check Severity (Conditions)
      const conditions = (rule.conditions as any) || {};
      if (conditions.severity && conditions.severity.length > 0) {
        if (!conditions.severity.includes(event.severity)) return false;
      }

      // c. Check Project (Conditions)
      if (event.projectId && conditions.projects && conditions.projects.length > 0) {
        if (!conditions.projects.includes(event.projectId)) return false;
      }

      // d. Check Branch (Conditions)
      if (event.branch && conditions.branches && conditions.branches.length > 0) {
        if (!conditions.branches.includes(event.branch)) return false;
      }

      return true;
    });

    if (matchingRules.length === 0) {
      console.log(`[Engine] No matching rules for event ${event.type} in workspace ${event.workspaceId}`);
      return;
    }

    // 3. Identify all unique channels across matching rules
    const channelIds = new Set<string>();
    matchingRules.forEach((rule) => {
      rule.channels.forEach((id) => channelIds.add(id));
    });

    if (channelIds.size === 0) {
      console.log(`[Engine] Matching rules found but no channels linked.`);
      return;
    }

    // 4. Dispatch to these channels
    // Note: dispatchNotification currently fetches all active channels for the workspace.
    // We should modify dispatchNotification to take specific channel IDs, 
    // or just let it handle the fanning out to specific IDs here.
    
    // For now, to keep it simple, we will fetch the specific channels and dispatch.
    const channels = await prisma.notificationChannel.findMany({
      where: {
        id: { in: Array.from(channelIds) },
        enabled: true,
      }
    });

    if (channels.length === 0) return;

    const { addNotificationJob } = await import("@/lib/queue/notification-queue");

    const commonPayload = {
      title: event.title,
      message: event.message,
      description: event.description,
      type: event.severity === "critical" || event.severity === "error" ? "error" : event.severity === "warning" ? "warning" : "info",
      severity: event.severity,
      fields: event.fields,
      metadata: event.metadata,
      timestamp: new Date().toISOString(),
      platform: "XtraSecurity",
    };

    // Offload to BullMQ for reliable delivery
    await Promise.allSettled(
      channels.map(async (channel) => {
        let payload = { ...commonPayload };
        
        // Add channel-specific email data if needed
        if (channel.type === "email") {
          const typeColor = commonPayload.type === "error" ? "#EF4444" : commonPayload.type === "warning" ? "#F59E0B" : "#6366F1";
          (payload as any).subject = `[XtraSecurity] ${event.title}`;
          (payload as any).text = `${event.title}\n\n${event.message}`;
          (payload as any).html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:8px"><div style="background:${typeColor};padding:12px 20px;border-radius:6px 6px 0 0"><h2 style="color:#fff;margin:0;font-size:16px">🔔 ${event.title}</h2></div><div style="padding:20px;background:#f9fafb"><p style="color:#111827;font-size:15px;margin-top:0">${event.message}</p>${event.description ? `<p style="color:#6b7280;font-size:13px">${event.description}</p>` : ""}</div><p style="font-size:11px;color:#9ca3af;padding:10px 20px 0">XtraSecurity &bull; ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p></div>`;
        }

        await addNotificationJob({ channel, payload });
      })
    );

    // 5. Save a notification for the workspace owner so it shows in their Alerts tab.
    // Also notify any team members who belong to this workspace via TeamUser.
    try {
      // Get workspace owner
      const workspace = await prisma.workspace.findUnique({
        where: { id: event.workspaceId },
        select: { createdBy: true, user: { select: { email: true } } },
      });

      const recipients: { userId: string; userEmail: string }[] = [];

      if (workspace) {
        recipients.push({
          userId: workspace.createdBy,
          userEmail: workspace.user.email || "unknown@xtrasecurity.in",
        });
      }

      // Also include team members who are in this workspace's projects' teams
      const teamUsers = await prisma.teamUser.findMany({
        where: {
          status: "active",
          team: {
            teamProjects: {
              some: {
                project: { workspaceId: event.workspaceId },
              },
            },
          },
        },
        select: { userId: true, user: { select: { email: true } } },
      });

      for (const tu of teamUsers) {
        if (!recipients.find((r) => r.userId === tu.userId)) {
          recipients.push({
            userId: tu.userId,
            userEmail: tu.user.email || "",
          });
        }
      }

      // Create one Notification record per recipient
      await Promise.allSettled(
        recipients.map((r) =>
          prisma.notification.create({
            data: {
              userId: r.userId,
              userEmail: r.userEmail,
              taskTitle: event.title,
              description: event.description || event.message,
              message: event.message,
              status: event.severity,
              read: false,
              workspaceId: event.workspaceId,
            },
          })
        )
      );
    } catch (notifErr) {
      console.error("[Engine] Failed to persist notifications:", notifErr);
    }

  } catch (error) {
    console.error("[Engine] Error processing notification:", error);
  }
}
