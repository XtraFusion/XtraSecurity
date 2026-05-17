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
                "group transition-all duration-300 border cursor-pointer overflow-hidden relative bg-card",
                isList 
                    ? "flex flex-row items-center justify-between p-6" 
                    : "flex flex-col hover:-translate-y-1 hover:shadow-xl h-[230px]"
            )}
            style={{
                borderColor: isHovered ? `${baseHex}60` : "rgba(255, 255, 255, 0.08)",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onNavigate}
        >
            {/* Hover top border accent matching team's color */}
            {!isList && (
                <div 
                    className="absolute top-0 left-0 w-full h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                        background: `linear-gradient(to right, transparent, ${baseHex}, transparent)`
                    }}
                />
            )}

            <CardHeader className={isList ? "flex-1 pb-6 p-0" : "pb-4"}>
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <CardTitle className="text-lg font-semibold truncate min-w-0 text-white group-hover:text-white transition-colors">
                                {team.name}
                            </CardTitle>
                            {team.isPrivate ? (
                                <Badge variant="outline" className="text-[10px] shrink-0 bg-rose-950/20 text-rose-400 border-rose-900/40 gap-1 rounded-full py-0.5"><Lock className="h-3 w-3" /> Private</Badge>
                            ) : (
                                <Badge variant="outline" className="text-[10px] shrink-0 bg-emerald-950/20 text-emerald-400 border-emerald-900/40 gap-1 rounded-full py-0.5"><Globe className="h-3 w-3" /> Public</Badge>
                            )}
                        </div>
                        <CardDescription className="line-clamp-2 min-h-[40px] text-sm text-zinc-400">
                            {team.description || "No description provided for this team."}
                        </CardDescription>
                    </div>

                    {/* Circular Initial Badge replacing Folder Icon footprint */}
                    {!isList && (
                        <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-black uppercase shrink-0 transition-all duration-300 group-hover:scale-105 border shadow-inner"
                            style={{
                                backgroundColor: `${baseHex}15`,
                                color: baseHex,
                                borderColor: `${baseHex}30`
                            }}
                        >
                            {team.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className={isList ? "flex items-center gap-8 py-0 p-0" : "pb-4"}>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1.5" title="Team Members">
                        <Users className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{team.members?.length || 0} Members</span>
                    </div>
                    <div className="flex -space-x-1.5">
                        {team.members?.slice(0, 3).map((m, i) => (
                            <div 
                                key={i} 
                                className={cn(
                                    "h-6 w-6 rounded-full border border-zinc-950 bg-gradient-to-br flex items-center justify-center text-[8px] font-bold text-white uppercase shadow-sm",
                                    getAvatarGradient(m.name || 'U')
                                )}
                                title={m.name}
                            >
                                {m.name?.[0] || 'U'}
                            </div>
                        ))}
                        {team.members?.length > 3 && (
                            <div className="h-6 w-6 rounded-full border border-zinc-950 bg-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-500 shadow-sm">
                                +{team.members.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className={isList ? "py-0 justify-end p-0" : "pt-0 border-t border-white/5 bg-zinc-900/10 py-3 mt-auto"}>
                <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Updated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </span>

                    {!isList && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 group/btn ml-auto text-zinc-400 hover:text-white transition-colors">
                            Manage <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                        </Button>
                    )}
                </div>
            </CardFooter>

            {/* Management Trigger */}
            {canManage && (
                <div className={cn(
                    "absolute top-6 right-6 z-20",
                    isList ? "relative top-0 right-0 ml-4 p-0" : ""
                )} onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800/60 rounded-xl transition-all">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 min-w-[160px] backdrop-blur-xl shadow-2xl z-[99999]">
                            <DropdownMenuItem onClick={onNavigate} className="rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-400 focus:bg-zinc-800 focus:text-white py-3 px-4 transition-all cursor-pointer">
                                <Edit3 className="mr-3 h-3.5 w-3.5 text-zinc-400" /> Edit Unit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800/80" />
                            <DropdownMenuItem onClick={onDelete} className="rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-500 focus:bg-red-950/40 focus:text-red-400 py-3 px-4 transition-all cursor-pointer">
                                <Trash2 className="mr-3 h-3.5 w-3.5 text-red-400" /> Terminate Team
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </Card>
    )
}
