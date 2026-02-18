"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

export type Workspace = {
  id: string;
  name: string;
  value: string; // for compatibility with switcher
  label: string; // for compatibility with switcher
  workspaceType: string;
  subscriptionPlan: string;
  role?: string; // implicit from context if needed
};

export function useWorkspaces() {
  const { data: session, status } = useSession();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    if (status !== "authenticated") return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/workspace");
      if (res.status === 200) {
        // Map to include label/value for UI components that might need it
        const mapped = res.data.map((w: any) => ({
          ...w,
          label: w.name,
          value: w.id,
        }));
        setWorkspaces(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch workspaces", err);
      setError("Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchWorkspaces();
    }
  }, [status]);

  return { 
    workspaces, 
    loading, 
    error, 
    fetchWorkspaces,
    isAuthenticated: status === "authenticated"
  };
}
