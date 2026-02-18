"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Zap, Shield, User } from "lucide-react";
import { Tier } from "@/lib/rate-limit-config";

interface UserAvatarProps {
    name?: string | null;
    image?: string | null;
    tier?: Tier | string | null;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function UserAvatar({ name, image, tier, className, size = "md" }: UserAvatarProps) {
    const getTierIcon = (tier: string = "free") => {
        switch (tier?.toLowerCase()) {
            case "pro":
                return <Zap className="h-full w-full text-primary fill-primary" />;
            case "enterprise":
                return <Shield className="h-full w-full text-primary fill-primary" />;
            default:
                return <User className="h-full w-full text-muted-foreground" />;
        }
    };

    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-9 w-9",
        lg: "h-20 w-20",
    };

    const overlaySizes = {
        sm: "h-3.5 w-3.5 p-0.5",
        md: "h-4 w-4 p-0.5",
        lg: "h-7 w-7 p-1",
    };

    const currentTier = (tier || "free") as string;

    return (
        <div className={`relative inline-block ${className}`}>
            <Avatar className={`${sizeClasses[size]} border border-border shadow-sm`}>
                {image && <AvatarImage src={image} alt={name || "User"} />}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {name?.charAt(0) || "U"}
                </AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 bg-background border border-border rounded-full shadow-sm flex items-center justify-center ${overlaySizes[size]}`}>
                {getTierIcon(currentTier)}
            </div>
        </div>
    );
}
