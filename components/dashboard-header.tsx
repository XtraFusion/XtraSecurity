"use client";

import { Menu, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { NotificationsPopover } from "./notifications-popover";
import { UserAvatar } from "./ui/user-avatar";
import { useUser } from "@/hooks/useUser";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import Link from "next/link"; // Assuming we might link to profile/settings
import Image from "next/image";

export function DashboardHeader({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
    const { user } = useUser();

    return (
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Mobile Sidebar Trigger */}
            <div className="flex items-center gap-2 lg:hidden">
                <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setSidebarOpen(true)}>
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
                <div className="flex items-center gap-2 font-bold">
                    <Image src="/apple-touch-icon.png" alt="XtraSecurity Logo" width={24} height={24} className="rounded-md" />
                    <span>XtraSecurity</span>
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex flex-1 items-center justify-end gap-2">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                    {/* Add Search here if needed */}
                </div>

                <NotificationsPopover />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <UserAvatar name={user?.name} image={user?.image} className="h-8 w-8" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings">Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
