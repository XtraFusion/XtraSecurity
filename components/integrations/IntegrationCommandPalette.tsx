"use client";

import React, { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { INTEGRATION_METADATA, SyncProvider } from "@/lib/integrations/config";
import { Badge } from "@/components/ui/badge";

interface IntegrationCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProvider: (provider: SyncProvider) => void;
  statuses: Record<string, any>;
}

export function IntegrationCommandPalette({
  open,
  onOpenChange,
  onSelectProvider,
  statuses,
}: IntegrationCommandPaletteProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!mounted) return null;

  // Group providers by category
  const providers = Object.keys(INTEGRATION_METADATA) as SyncProvider[];
  const categories = {
    source: providers.filter(p => INTEGRATION_METADATA[p].category === "source"),
    deployment: providers.filter(p => INTEGRATION_METADATA[p].category === "deployment"),
    cloud: providers.filter(p => INTEGRATION_METADATA[p].category === "cloud"),
    notifications: providers.filter(p => INTEGRATION_METADATA[p].category === "notifications"),
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "source": return "Source Control";
      case "deployment": return "Deployment";
      case "cloud": return "Cloud Infrastructure";
      case "notifications": return "Notifications & Alerts";
      default: return "Other";
    }
  };

  const renderGroup = (categoryKey: keyof typeof categories) => {
    const items = categories[categoryKey];
    if (items.length === 0) return null;

    return (
      <CommandGroup key={categoryKey} heading={getCategoryLabel(categoryKey)}>
        {items.map((provider) => {
          const meta = INTEGRATION_METADATA[provider];
          const isConnected = statuses[provider]?.connected;

          return (
            <CommandItem
              key={provider}
              value={meta.name}
              onSelect={() => {
                onSelectProvider(provider);
                onOpenChange(false);
              }}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 shadow-sm ${meta.iconBg}`}
                >
                  {meta.icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{meta.name}</span>
                  <span className="text-xs text-muted-foreground">{meta.detailText}</span>
                </div>
              </div>
              {isConnected && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-green-500/10 text-green-600 border-green-500/20">
                  Connected
                </Badge>
              )}
            </CommandItem>
          );
        })}
      </CommandGroup>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search 50+ integrations..." />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No integrations found.</CommandEmpty>
        {renderGroup("source")}
        {renderGroup("deployment")}
        {renderGroup("cloud")}
        {renderGroup("notifications")}
      </CommandList>
    </CommandDialog>
  );
}
