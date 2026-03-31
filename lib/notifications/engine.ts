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

    // Call dispatch logic for each matched channel
    const { sendSlackNotification } = await import("./slack");
    const { sendTeamsNotification } = await import("./teams");
    const { sendWebhookNotification } = await import("./webhook");

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

    await Promise.allSettled(
      channels.map(async (channel) => {
        try {
          if (channel.type === "slack") {
            const webhookUrl = (channel.config as any)?.webhookUrl || (channel.config as any)?.slackChannel;
            if (webhookUrl) await sendSlackNotification(webhookUrl, commonPayload as any);
          } else if (channel.type === "teams") {
            const webhookUrl = (channel.config as any)?.teamsWebhook || (channel.config as any)?.webhookUrl;
            if (webhookUrl) await sendTeamsNotification(webhookUrl, commonPayload);
          } else if (channel.type === "webhook") {
            const webhookUrl = (channel.config as any)?.webhookUrl;
            if (webhookUrl) await sendWebhookNotification(webhookUrl, commonPayload);
          }
        } catch (err) {
          console.error(`[Engine] Failed to dispatch to channel ${channel.name}:`, err);
        }
      })
    );

    // 5. Create a system notification (Alert) so it shows up in the UI
    // Usually these engine-triggered events are important enough to be saved to the DB
    await prisma.notification.create({
      data: {
        userId: "system", // Or associated user if known from event
        userEmail: "system@xtrasecurity.in",
        taskTitle: event.title,
        description: event.description || event.message,
        message: event.message,
        status: event.severity,
        read: false,
        workspaceId: event.workspaceId,
      }
    });

  } catch (error) {
    console.error("[Engine] Error processing notification:", error);
  }
}
