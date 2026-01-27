"use client";

import { useState, useEffect } from "react";
import { Bell, Check, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import apiClient from "@/lib/axios";
import { Badge } from "@/components/ui/badge";

interface Notification {
    id: string;
    taskTitle: string;
    description: string;
    message: string;
    status: "info" | "warning" | "error" | "success";
    read: boolean;
    createdAt: string;
}

export function NotificationsPopover() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await apiClient.get("/api/notifications");
            const data = response.data.notifications || [];
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.read).length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        // Poll every 30 seconds to keep fresh
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch when opening to ensure fresh data
    const onOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            fetchNotifications();
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await apiClient.patch("/api/notifications", { id, read: true });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        // Optimistic update
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length === 0) return;

        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            // Since we don't have a bulk update endpoint yet, we loop. 
            // Ideally backend should support bulk update.
            await Promise.all(unreadIds.map(id => apiClient.patch("/api/notifications", { id, read: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
            fetchNotifications(); // Revert on error
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "success": return "bg-green-500";
            case "warning": return "bg-yellow-500";
            case "error": return "bg-red-500";
            default: return "bg-blue-500";
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="xs"
                            className="h-auto px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={markAllAsRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-muted/30" : ""
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${getStatusColor(notification.status)}`} />
                                        <div className="space-y-1 flex-1">
                                            <p className={`text-sm leading-none ${!notification.read ? "font-medium" : ""}`}>
                                                {notification.taskTitle}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => markAsRead(notification.id)}
                                                title="Mark as read"
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                    <Link href="/notifications" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full text-xs gap-2">
                            View all notifications <ExternalLink className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
