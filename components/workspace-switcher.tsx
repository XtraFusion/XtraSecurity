"use client";

import { useEffect, useState, useRef } from "react";
import {
  ChevronsUpDown,
  CheckIcon,
  PlusCircleIcon,
} from "lucide-react";
import { useGlobalContext } from "@/hooks/useUser";

type Workspace = {
  id: string;
  label: string;
  value: string;
};

export default function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const [creatingName, setCreatingName] = useState("");
  const [creatingPlan, setCreatingPlan] = useState("free");

  const { selectedWorkspace, setSelectedWorkspace } = useGlobalContext();
  const fetchedRef = useRef(false)

  useEffect(() => {
    const fetchWorkspaces = async (signal?: AbortSignal) => {
      try {
        const res = await fetch(`/api/workspace`, { signal });
        if (!res.ok) return;
        const data = await res.json();
        const mapped: Workspace[] = (data || []).map((w: any) => ({
          id: w.id,
          label: w.name,
          value: w.id,
        }));
        setWorkspaces(mapped);
        if (mapped.length && !selectedWorkspace) setSelectedWorkspace(mapped[0]);
      } catch (err: any) {
        console.error("Failed to fetch workspaces", err);
      }
    };
    if (!fetchedRef.current) {
      fetchedRef.current = true
      const controller = new AbortController()
      fetchWorkspaces(controller.signal)
      return () => controller.abort()
    }
  }, []);

  const createWorkspace = async () => {
    if (!creatingName) return;
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
        return;
      }
      const w = await res.json();
      const mapped: Workspace = { id: w.id, label: w.name, value: w.id };
      setWorkspaces((s) => [mapped, ...s]);
      setSelectedWorkspace(mapped);
      setShowNewWorkspaceDialog(false);
      setCreatingName("");
      setCreatingPlan("free");
    } catch (err) {
      console.error("Error creating workspace", err);
    }
  };

  return (
    <div className="relative w-full">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm 
                   bg-white hover:bg-gray-50 text-black 
                   dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-white
                   focus:outline-none"
      >
        <div className="flex items-center space-x-2">
          <img
            src={`https://avatar.vercel.sh/${
              selectedWorkspace?.value ?? "default"
            }.png`}
            alt={selectedWorkspace?.label ?? "Workspace"}
            className="h-5 w-5 rounded-full"
          />
          <span>
            {selectedWorkspace && selectedWorkspace?.label?.length > 10
              ? selectedWorkspace?.label.slice(0, 10) + "..."
              : selectedWorkspace?.label ?? "Select workspace"}
          </span>
        </div>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute mt-2 w-[200px] shadow-lg rounded-md border z-20
                        bg-white border-gray-200 
                        dark:bg-gray-900 dark:border-gray-700">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search Workspace..."
              className="w-full px-2 py-1 border rounded-md text-sm 
                         bg-white text-black border-gray-300 focus:outline-none 
                         dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {workspaces.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No Workspace found.
              </p>
            )}
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => {
                  setSelectedWorkspace(ws);
                  setOpen(false);
                }}
                className="flex items-center px-3 py-2 text-sm cursor-pointer 
                           hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <img
                  src={`https://avatar.vercel.sh/${ws.value}.png`}
                  alt={ws.label}
                  className="h-5 w-5 rounded-full grayscale mr-2"
                />
                <span>{ws.label}</span>
                {selectedWorkspace?.value === ws.value && (
                  <CheckIcon className="ml-auto h-4 w-4" />
                )}
              </div>
            ))}
          </div>
          <div className="border-t dark:border-gray-700">
            <div
              onClick={() => {
                setOpen(false);
                setShowNewWorkspaceDialog(true);
              }}
              className="flex items-center px-3 py-2 text-sm cursor-pointer 
                         hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <PlusCircleIcon className="mr-2 h-5 w-5" />
              Create Workspace
            </div>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showNewWorkspaceDialog && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-md shadow-lg w-full max-w-md p-6 border dark:border-gray-700">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Create Workspace
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Add a new Workspace to manage products and customers.
            </p>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1 text-black dark:text-white"
                >
                  Workspace name
                </label>
                <input
                  id="name"
                  value={creatingName}
                  onChange={(e) => setCreatingName(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full border rounded-md px-3 py-2 text-sm 
                             bg-white text-black border-gray-300 focus:outline-none 
                             dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="plan"
                  className="block text-sm font-medium mb-1 text-black dark:text-white"
                >
                  Subscription plan
                </label>
                <select
                  id="plan"
                  value={creatingPlan}
                  onChange={(e) => setCreatingPlan(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm 
                             bg-white text-black border-gray-300 focus:outline-none 
                             dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="free">Free - Trial for two weeks</option>
                  <option value="pro">Pro - $9/month per user</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowNewWorkspaceDialog(false)}
                className="px-4 py-2 border rounded-md text-sm 
                           hover:bg-gray-50 dark:hover:bg-gray-800 
                           border-gray-300 dark:border-gray-600 
                           text-black dark:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createWorkspace}
                className="px-4 py-2 rounded-md text-sm 
                           bg-black text-white hover:bg-gray-800 
                           dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
