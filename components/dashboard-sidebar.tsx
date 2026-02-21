"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Home,
    FolderOpen,
    Users,
    FileText,
    User,
    Settings,
    Shield,
    RotateCcw,
    HelpCircle,
    Bell,
    Zap,
    Key,
    Lock,
    LayoutDashboard,
    BookOpen,
    CreditCard
} from "lucide-react";

import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useUser } from "@/hooks/useUser"; // Or context
import { UserAvatar } from "./ui/user-avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { logout } from "@/lib/auth";

// Fix import for TeamSwitcher if it was default
import MainTeamSwitcher from "./workspace-switcher";

interface SidebarProps {
    className?: string;
    mobile?: boolean;
    onClose?: () => void;
}

const NAV_GROUPS = [
    {
        label: "Platform",
        items: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Projects", href: "/projects", icon: FolderOpen },
            { name: "Teams", href: "/teams", icon: Users },
        ]
    },
    {
        label: "Security",
        items: [
            { name: "Secret Rotation", href: "/rotation", icon: RotateCcw },
            { name: "Access Requests", href: "/access-requests", icon: Key },
            { name: "Access Reviews", href: "/admin/reviews", icon: Shield },
            { name: "Audit Logs", href: "/audit", icon: FileText },
        ]
    },
    {
        label: "Configuration",
        items: [
            { name: "Integrations", href: "/integrations", icon: Zap },
            { name: "Notifications", href: "/notifications", icon: Bell },
            { name: "Settings", href: "/settings", icon: Settings },
            { name: "Subscription & Usages", href: "/subscription", icon: CreditCard },
            { name: "Documentation", href: "/docs", icon: BookOpen },
        ]
    }
];

export function DashboardSidebar({ className, mobile, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user, selectedWorkspace } = useUser();
    const { theme, setTheme } = useTheme();

    const isWorkspaceOwner = selectedWorkspace?.createdBy === user?.id;
    const isPersonalWorkspace = selectedWorkspace?.workspaceType === "personal";
    const hasAdminAccess = isPersonalWorkspace || isWorkspaceOwner;

    return (
        <div className={`flex flex-col h-full bg-card text-card-foreground border-r border-border ${className}`}>
            {/* Header / Logo */}
            <div className="h-14 flex items-center px-6 border-b border-border/40">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                    <Image src="/apple-touch-icon.png" alt="XtraSecurity Logo" width={28} height={28} className="rounded-md" />
                    XtraSecurity
                </Link>
            </div>

            {/* Team Switcher */}
            <div className="p-4 pb-2">
                <MainTeamSwitcher />
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 min-h-0 px-4 py-2">
                <nav className="space-y-6">
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label} className="space-y-1">
                            <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                {group.label}
                            </h4>
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                // Filter restricted links for non-admins in shared workspaces
                                if (!hasAdminAccess && ["Integrations", "Settings", "Notifications", "Documentation"].includes(item.name)) {
                                    if (["Integrations", "Settings"].includes(item.name)) return null;
                                }

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </ScrollArea>

            {/* User Footer */}
            <div className="p-4 border-t border-border/40 bg-zinc-50/50 dark:bg-zinc-900/50">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start px-2 h-auto py-2 hover:bg-background">
                            <div className="flex items-center gap-3 w-full">
                                <UserAvatar name={user?.name} image={user?.image} className="h-8 w-8" />
                                <div className="flex flex-col items-start min-w-0 flex-1">
                                    <span className="text-sm font-medium truncate w-full text-left">{user?.name}</span>
                                    <span className="text-xs text-muted-foreground truncate w-full text-left">{user?.email}</span>
                                </div>
                                <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56" side="right" sideOffset={10}>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                            <span>Toggle Theme</span>
                        </DropdownMenuItem>
                        {hasAdminAccess && (
                            <DropdownMenuItem asChild>
                                <Link href="/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
                            </DropdownMenuItem>
                        )}
                        {hasAdminAccess && (
                            <DropdownMenuItem asChild>
                                <Link href="/subscription"><CreditCard className="mr-2 h-4 w-4" /> Subscription & Usages</Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => logout()}>
                            <LogOut className="mr-2 h-4 w-4" /> Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
