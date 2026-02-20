"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGlobalContext } from "@/hooks/useUser";

type Workspace = {
  id: string;
  label: string;
  value: string;
};

export default function WorkspaceSwitcher({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = React.useState(false);

  const {
    selectedWorkspace,
    setSelectedWorkspace,
    workspaces,
    refreshWorkspaces
  } = useGlobalContext();

  const [creatingName, setCreatingName] = React.useState("");
  const [creatingPlan, setCreatingPlan] = React.useState("free");
  const [isLoading, setIsLoading] = React.useState(false);

  // Select first workspace if none selected 
  React.useEffect(() => {
    if (!selectedWorkspace && workspaces && workspaces.length > 0) {
      setSelectedWorkspace(workspaces[0]);
    }
  }, [workspaces, selectedWorkspace, setSelectedWorkspace]);

  const createWorkspace = async () => {
    if (!creatingName) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: creatingName,
          subscriptionPlan: creatingPlan,
        }),
      });
      if (!res.ok) {
        console.error("Failed to create workspace");
        setIsLoading(false);
        return;
      }
      const w = await res.json();
      const mapped: Workspace = { id: w.id, label: w.name, value: w.id };

      // Refetch workspaces from database to ensure consistency
      await refreshWorkspaces();

      setSelectedWorkspace(mapped);
      localStorage.setItem("selectedWorkspace", JSON.stringify(mapped));
      setShowNewWorkspaceDialog(false);
      setCreatingName("");
      setCreatingPlan("free");
      window.location.reload();
    } catch (err) {
      console.error("Error creating workspace", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showNewWorkspaceDialog} onOpenChange={setShowNewWorkspaceDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a workspace"
            className={cn("w-full justify-between", className)}
          >
            {selectedWorkspace?.icon && !selectedWorkspace.icon.startsWith("http") ? (
              <div className="mr-2 h-5 w-5 flex items-center justify-center text-sm">
                {selectedWorkspace.icon}
              </div>
            ) : (
              <Avatar className="mr-2 h-5 w-5">
                <AvatarImage
                  src={selectedWorkspace?.icon?.startsWith("http") ? selectedWorkspace.icon : `https://avatar.vercel.sh/${selectedWorkspace?.value}.png`}
                  alt={selectedWorkspace?.label}
                  className={selectedWorkspace?.icon?.startsWith("http") ? "object-cover" : "grayscale"}
                />
                <AvatarFallback>WS</AvatarFallback>
              </Avatar>
            )}
            <span className="truncate flex-1 text-left">
              {selectedWorkspace?.label || "Select workspace"}
            </span>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search workspace..." />
              <CommandEmpty>No workspace found.</CommandEmpty>
              <CommandGroup heading="Workspaces">
                {workspaces?.map((workspace: any) => (
                  <CommandItem
                    key={workspace.value}
                    onSelect={() => {
                      setSelectedWorkspace(workspace);
                      localStorage.setItem("selectedWorkspace", JSON.stringify(workspace));
                      setOpen(false);
                      window.location.reload();
                    }}
                    className="text-sm"
                  >
                    {workspace.icon && !workspace.icon.startsWith("http") ? (
                      <div className="mr-2 h-5 w-5 flex items-center justify-center text-sm">
                        {workspace.icon}
                      </div>
                    ) : (
                      <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage
                          src={workspace.icon?.startsWith("http") ? workspace.icon : `https://avatar.vercel.sh/${workspace.value}.png`}
                          alt={workspace.label}
                          className={workspace.icon?.startsWith("http") ? "object-cover" : "grayscale"}
                        />
                        <AvatarFallback>WS</AvatarFallback>
                      </Avatar>
                    )}
                    {workspace.label}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedWorkspace?.value === workspace.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowNewWorkspaceDialog(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create Workspace
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Add a new workspace to manage products and customers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input
              id="name"
              placeholder="Acme Inc."
              value={creatingName}
              onChange={(e) => setCreatingName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan">Subscription plan</Label>
            <Select value={creatingPlan} onValueChange={setCreatingPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <span className="font-medium">Free</span> -{" "}
                  <span className="text-muted-foreground">
                    Trial for two weeks
                  </span>
                </SelectItem>
                <SelectItem value="pro">
                  <span className="font-medium">Pro</span> -{" "}
                  <span className="text-muted-foreground">
                    $9/month per user
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewWorkspaceDialog(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={createWorkspace} disabled={isLoading}>
            {isLoading ? "Creating..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
