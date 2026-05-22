"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Users, Lock, Globe, ChevronRight, MoreVertical, Edit3, Trash2, Clock } from "lucide-react"
import { 
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface Team {
    id: string
    name: string
    description: string
    members: any[]
    teamColor: string
    isPrivate: boolean
}

interface PremiumTeamCardProps {
    team: Team
    viewMode: "grid" | "list"
    canManage: boolean
    onDelete: () => void
    onNavigate: () => void
}

export function PremiumTeamCard({ 
    team, 
    viewMode, 
    canManage, 
    onDelete, 
    onNavigate 
}: PremiumTeamCardProps) {
    const isList = viewMode === "list"
    const [isHovered, setIsHovered] = useState(false)

    // Modern color configurations for glowing spot effects
    const colorMap: Record<string, string> = {
        "bg-blue-500": "#3b82f6",
        "bg-purple-500": "#a855f7",
        "bg-emerald-500": "#10b981",
        "bg-amber-500": "#f59e0b",
        "bg-rose-500": "#f43f5e",
        "bg-indigo-500": "#6366f1",
        "bg-cyan-500": "#06b6d4",
        "bg-zinc-500": "#71717a",
    };

    const baseHex = colorMap[team.teamColor] || "#3b82f6";

    const getAvatarGradient = (name: string) => {
        if (!name) return "from-zinc-600 to-slate-700";
        const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const gradients = [
            "from-blue-600 to-indigo-600",
            "from-emerald-600 to-teal-600",
            "from-purple-600 to-fuchsia-600",
            "from-amber-600 to-orange-600",
            "from-rose-600 to-pink-600",
            "from-cyan-600 to-sky-600",
        ];
        return gradients[charCodeSum % gradients.length];
    };

    return (
        <Card
            className={cn(
                "group transition-all duration-300 border-border/60 hover:border-primary/50 cursor-pointer overflow-hidden relative bg-card/50",
                isList 
                    ? "flex flex-row items-center justify-between p-4 px-6" 
                    : "flex flex-col hover:-translate-y-1 hover:shadow-xl h-[230px]"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onNavigate}
        >
            {/* Left border accent */}
            {!isList && (
                <div 
                    className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300"
                />
            )}

            <CardHeader className={isList ? "flex-1 p-0 min-w-0" : "pb-3 px-5 pt-5"}>
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 overflow-hidden flex-1">
                        <div className="flex items-center gap-2">
                            {team.isPrivate ? (
                                <Badge variant="secondary" className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-sm shrink-0">
                                    Private
                                </Badge>
                            ) : (
                                <Badge variant="default" className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-sm shrink-0">
                                    Public
                                </Badge>
                            )}
                        </div>
                        <h3 className="text-lg font-semibold overflow-hidden text-ellipsis whitespace-nowrap group-hover:text-primary transition-colors" title={team.name}>
                            {team.name}
                        </h3>
                        <CardDescription className="line-clamp-2 text-xs mt-1 leading-relaxed">
                            {team.description || "No description provided."}
                        </CardDescription>
                    </div>

                    {/* Management Trigger in Flex Layout (Grid View) */}
                    {!isList && canManage && (
                        <div className="-mt-1 -mr-2 shrink-0" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md transition-all">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={onNavigate} className="cursor-pointer">
                                        <Edit3 className="mr-2 h-4 w-4 text-muted-foreground" /> Edit Unit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Terminate Team
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className={isList ? "flex items-center gap-6 py-0 px-6 shrink-0" : "px-5 pb-5 pt-2 mt-auto"}>
                <div className={cn(
                    "flex items-center gap-3 w-full text-xs text-muted-foreground",
                    !isList && "justify-between pt-4 border-t border-border/50"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/80 transition-colors px-2 py-1.5 rounded-md" title="Team Members">
                            <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
                            <span className="font-medium">{team.members?.length || 0} Members</span>
                        </div>
                        <div className="flex -space-x-1.5">
                            {team.members?.slice(0, 3).map((m, i) => (
                                <div 
                                    key={i} 
                                    className="h-6 w-6 rounded-full border border-background bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary uppercase shadow-sm"
                                    title={m.name}
                                >
                                    {m.name?.[0] || 'U'}
                                </div>
                            ))}
                            {team.members?.length > 3 && (
                                <div className="h-6 w-6 rounded-full border border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm">
                                    +{team.members.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className={isList ? "py-0 p-0 flex items-center shrink-0 gap-6" : "pt-0 border-t border-border/50 bg-muted/5 py-3 mt-auto"}>
                <div className={cn("flex items-center w-full", !isList && "justify-between")}>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" /> Updated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </span>

                    {!isList && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 group/btn ml-auto text-muted-foreground hover:text-foreground">
                            Manage <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                        </Button>
                    )}
                </div>

                {/* Management Trigger in Flex Layout (List View) */}
                {isList && canManage && (
                    <div className="shrink-0" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md transition-all">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onNavigate} className="cursor-pointer">
                                    <Edit3 className="mr-2 h-4 w-4 text-muted-foreground" /> Edit Unit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Terminate Team
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
