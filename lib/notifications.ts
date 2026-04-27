import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";

export type NotificationStatus = "info" | "warning" | "error" | "success";

export async function createNotification(
  userId: string,
  userEmail: string,
  taskTitle: string,
  description: string,
  message: string,
  status: NotificationStatus = "info",
  workspaceId?: string | null
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        userEmail,
        taskTitle,
        description,
        message,
        status,
        read: false,
        workspaceId: workspaceId || null
      },
    });

    // 1. Send hardcoded primary email (Legacy/Primary)
    if (userEmail) {
      sendEmail({
        to: userEmail,
        subject: `[XtraSecurity] ${taskTitle}`,
        text: `${description}\n\n${message}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #4f46e5;">XtraSecurity Notification</h2>
            <p><strong>${taskTitle}</strong></p>
            <p>${description}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #4b5563;">${message}</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">This is an automated message from your XtraSecurity platform.</p>
          </div>
        `
      }).catch(err => console.error("Failed to send primary notification email:", err));
    }

    // 2. Dispatch to ALL configured workspace channels (Slack, Discord, secondary Emails, etc.)
    const { dispatchNotification } = await import("./notifications/dispatch");
    dispatchNotification({
      title: taskTitle,
      message,
      description,
      type: status as any,
      workspaceId,
    }).catch(err => console.error("Failed to dispatch to workspace channels:", err));

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw, just log so main flow isn't interrupted
    return null;
  }
}
