"use client";

import type React from "react";

import { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  FolderOpen,
  Users,
  FileText,
  User,
  Settings,
  LogOut,
  Menu,
  Shield,
  Moon,
  Sun,
  RotateCcw,
  HelpCircle,
  Bell,
  Zap,
  Key,
  CreditCard,
} from "lucide-react";
import { useTheme } from "next-themes";
import { logout, getCurrentUser } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import TeamSwitcher from "./workspace-switcher";
import { UserContext } from "@/hooks/useUser";
import { UserAvatar } from "./ui/user-avatar";
import { AuthDebug } from "./auth-debug";
import { NotificationsPopover } from "./notifications-popover";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Secret Rotation", href: "/rotation", icon: RotateCcw },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Integrations", href: "/integrations", icon: Zap },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "Audit Logs", href: "/audit", icon: FileText },
  { name: "Access Reviews", href: "/admin/reviews", icon: Shield },
  { name: "Access Requests", href: "/access-requests", icon: Key },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Help", href: "/help", icon: HelpCircle },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const userContext = useContext(UserContext);

  if (!userContext) {
    return null;
  }
  const { user } = userContext;

  const handleLogout = () => {
    logout();
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? "w-full" : "w-64"} bg-card text-card-foreground border-r border-border`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/50">
        <div className="bg-primary/10 p-1.5 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight">XtraSecurity</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="w-full mb-8">
          <TeamSwitcher />
        </div>
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-border/50 bg-muted/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 hover:bg-background border border-transparent hover:border-border transition-all rounded-xl"
            >
              <UserAvatar
                name={user?.name}
                image={user?.image}
                tier={user?.tier}
                size="md"
              />
              <div className="flex flex-col items-start text-sm min-w-0">
                <span className="font-semibold truncate w-full">
                  {user?.name || "User"}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {user?.email}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 uppercase font-bold border-primary/30 text-primary">
                    {user?.tier || "free"}
                  </Badge>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 p-2" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <Badge className="text-[10px] px-1.5 h-4 uppercase font-black tracking-tighter">
                    {user?.tier || "free"}
                  </Badge>
                </div>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              Toggle theme
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-50">
        <div className="flex flex-col flex-grow bg-card border-r border-border shadow-sm">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <div className="bg-card h-full">
            <Sidebar mobile />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-40 flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Trigger */}
            <div className="lg:hidden">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
            </div>
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="font-semibold truncate">XtraSecurity</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <NotificationsPopover />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full relative p-0 h-8 w-8">
                    <UserAvatar
                      name={user?.name}
                      image={user?.image}
                      tier={user?.tier}
                      size="sm"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/subscription')} className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Subscription</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto">{children}</main>
      </div>
      <AuthDebug />
    </div>
  );
}
