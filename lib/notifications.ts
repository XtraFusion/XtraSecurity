import prisma from "@/lib/db";

export type NotificationStatus = "info" | "warning" | "error" | "success";

export async function createNotification(
  userId: string,
  userEmail: string,
  taskTitle: string,
  description: string,
  message: string,
  status: NotificationStatus = "info"
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
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw, just log so main flow isn't interrupted
    return null;
  }
}
