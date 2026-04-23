"use client"

import { cn } from "@/lib/utils"
import { Users, Shield, Lock, Globe, ArrowRight, MoreVertical, Edit3, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
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

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={cn(
                "group relative bg-white/[0.03] backdrop-blur-3xl transition-all duration-500",
                isList 
                    ? "flex items-center justify-between p-6 rounded-2xl" 
                    : "flex flex-col rounded-[2rem] overflow-hidden p-8 h-full"
            )}
            onClick={onNavigate}
        >
            {/* Toxic Accent Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#22d3ee]/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className={cn(
                "flex flex-1 gap-6",
                isList ? "items-center" : "flex-col items-start"
            )}>
                {/* Team Identifier */}
                <div className="relative">
                    <div className={cn(
                        "flex items-center justify-center rounded-2xl text-white font-black scale-95 group-hover:scale-100 transition-transform duration-500 shadow-2xl",
                        team.teamColor || "bg-[#22d3ee]",
                        isList ? "h-12 w-12 text-sm" : "h-16 w-16 text-xl"
                    )}>
                        {team.name.substring(0, 2).toUpperCase()}
                    </div>
                    {/* Status Pip */}
                    <div className={cn(
                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-[#0e131e] z-10",
                        team.isPrivate ? "bg-rose-500" : "bg-emerald-500"
                    )} />
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                        <h3 className={cn(
                           "font-black text-white tracking-tight uppercase tracking-widest",
                           isList ? "text-sm" : "text-xl"
                        )}>
                            {team.name}
                        </h3>
                        {team.isPrivate && <Lock className="h-3 w-3 text-slate-500" />}
                    </div>
                    <p className={cn(
                        "text-slate-500 font-bold leading-relaxed line-clamp-2",
                        isList ? "text-[10px]" : "text-xs"
                    )}>
                        {team.description || "No description provided."}
                    </p>
                </div>
            </div>

            {/* Bottom Actions / Info Area */}
            <div className={cn(
                "flex items-center justify-between mt-auto pt-8 border-t border-white/5",
                isList ? "hidden" : "flex"
            )}>
                {/* Member Avatars */}
                <div className="flex -space-x-3">
                    {team.members?.slice(0, 4).map((m, i) => (
                        <div 
                            key={i} 
                            className="h-8 w-8 rounded-full border-2 border-[#1a1f2e] bg-slate-800 flex items-center justify-center text-[10px] font-black text-white uppercase ring-1 ring-white/5"
                        >
                            {m.name?.[0] || 'U'}
                        </div>
                    ))}
                    {team.members?.length > 4 && (
                        <div className="h-8 w-8 rounded-full border-2 border-[#1a1f2e] bg-[#22d3ee]/10 flex items-center justify-center text-[10px] font-black text-[#22d3ee] ring-1 ring-white/10 backdrop-blur-xl">
                            +{team.members.length - 4}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">View Unit</span>
                     <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#22d3ee] group-hover:text-black transition-all duration-500">
                        <ArrowRight className="h-4 w-4" />
                     </div>
                </div>
            </div>

            {/* List Mode Stats */}
            {isList && (
                <div className="flex items-center gap-12 px-8">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Members</span>
                        <span className="text-xs font-black text-white">{team.members?.length || 0}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Visibility</span>
                        <span className="text-xs font-black text-white">{team.isPrivate ? "Private" : "Global"}</span>
                    </div>
                </div>
            )}

            {/* Management Trigger */}
            {canManage && (
                <div className={cn(
                    "absolute top-6 right-6",
                    isList ? "relative top-0 right-0 ml-4" : ""
                )} onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1f2e] border-white/5 rounded-2xl p-2 min-w-[160px] backdrop-blur-xl shadow-2xl">
                            <DropdownMenuItem onClick={onNavigate} className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 focus:bg-[#22d3ee] focus:text-black py-3 px-4 transition-all">
                                <Edit3 className="mr-3 h-3 w-3" /> Edit Unit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem onClick={onDelete} className="rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 focus:bg-rose-500 focus:text-white py-3 px-4 transition-all">
                                <Trash2 className="mr-3 h-3 w-3" /> Terminate Team
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </motion.div>
    )
}
