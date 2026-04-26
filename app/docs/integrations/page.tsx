"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Search, X, Globe, Blocks } from "lucide-react";
import { INTEGRATION_METADATA, SyncProvider } from "@/lib/integrations/config";

export default function IntegrationsLandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "source" | "deployment" | "cloud" | "notifications">("all");

  const categories = [
    { id: "all", label: "All Integrations" },
    { id: "source", label: "Source Control" },
    { id: "deployment", label: "Deployment" },
    { id: "cloud", label: "Cloud Infrastructure" },
    { id: "notifications", label: "Notifications" },
  ] as const;

  const providers = Object.keys(INTEGRATION_METADATA) as SyncProvider[];

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const meta = INTEGRATION_METADATA[p];
      const matchCat = activeCategory === "all" || meta.category === activeCategory;
      const matchSearch = meta.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          meta.detailText.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
      <Link href="/docs" className="inline-block mb-6">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Button>
      </Link>

      <div className="space-y-4 mb-12 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[11px] font-semibold tracking-tight text-primary">
          <Globe className="h-3.5 w-3.5" />
          Integration Directory
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          Connect Your Stack
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          XtraSecurity natively integrates with {providers.length}+ platforms. Push secrets, trigger deployments, and send audit alerts automatically.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20 p-2 rounded-xl border border-border/60 mb-8 sticky top-4 z-10 backdrop-blur-md">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto no-scrollbar pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                activeCategory === cat.id 
                  ? "bg-background text-primary shadow-sm border border-border/60" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search platforms..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-10 pl-9 pr-9 bg-background/50 border-border/60 focus-visible:ring-1"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filteredProviders.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-2xl bg-muted/10">
          <Blocks className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold">No integrations found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProviders.map(p => {
            const meta = INTEGRATION_METADATA[p];
            return (
              <Link key={p} href={`/docs/integrations/${p}`}>
                <div className="group p-5 rounded-xl bg-card border border-border shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-sm group-hover:scale-105 transition-transform duration-300 ${meta.iconBg}`}>
                      {meta.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-base tracking-tight">{meta.name}</h3>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 mt-0.5">
                        {meta.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                    {meta.detailText}
                  </p>
                  
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
