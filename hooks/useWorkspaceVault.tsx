"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useGlobalContext } from "@/hooks/useUser";

interface WorkspaceVaultContextType {
  workspaceId: string | null;
  workspacePassphrase: string;
  isWorkspaceUnlocked: boolean;
  unlockWorkspace: (passphrase: string, remember?: boolean) => void;
  lockWorkspace: () => void;
  setProjectPassphrase: (projectId: string, passphrase: string, remember?: boolean) => void;
  clearProjectPassphrase: (projectId: string) => void;
  getProjectVaultStatus: (projectId: string) => {
    isUnlocked: boolean;
    isDedicatedProjectKey: boolean;
    source: "project" | "workspace" | "global" | "none";
    passphrase: string;
  };
  resolveEffectivePassphrase: (projectId?: string) => {
    passphrase: string;
    source: "project" | "workspace" | "global" | "default" | "none";
  };
}

const WorkspaceVaultContext = createContext<WorkspaceVaultContextType | undefined>(undefined);

export const STORAGE_PREFIX = {
  PROJECT: "xtra_vault_",
  WORKSPACE: "xtra_ws_vault_",
  GLOBAL: "xtra_global_vault_passphrase",
};

export const WorkspaceVaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedWorkspace } = useGlobalContext();
  const currentWorkspaceId = selectedWorkspace?.id || selectedWorkspace?.value || null;

  const getStoredWorkspacePassphrase = useCallback((wsId: string | null): string => {
    if (typeof window === "undefined") return "";
    if (wsId) {
      const wsKey =
        sessionStorage.getItem(`${STORAGE_PREFIX.WORKSPACE}${wsId}`) ||
        localStorage.getItem(`${STORAGE_PREFIX.WORKSPACE}${wsId}`);
      if (wsKey) return wsKey;
    }
    return (
      sessionStorage.getItem(STORAGE_PREFIX.GLOBAL) ||
      localStorage.getItem(STORAGE_PREFIX.GLOBAL) ||
      ""
    );
  }, []);

  const [workspacePassphrase, setWorkspacePassphrase] = useState<string>(() =>
    getStoredWorkspacePassphrase(currentWorkspaceId)
  );

  // Sync state on workspace switch
  useEffect(() => {
    setWorkspacePassphrase(getStoredWorkspacePassphrase(currentWorkspaceId));
  }, [currentWorkspaceId, getStoredWorkspacePassphrase]);

  // Listen for storage / custom event changes across components
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVaultChange = () => {
      setWorkspacePassphrase(getStoredWorkspacePassphrase(currentWorkspaceId));
    };

    window.addEventListener("xtra-vault-change", handleVaultChange);
    window.addEventListener("storage", handleVaultChange);

    return () => {
      window.removeEventListener("xtra-vault-change", handleVaultChange);
      window.removeEventListener("storage", handleVaultChange);
    };
  }, [currentWorkspaceId, getStoredWorkspacePassphrase]);

  const unlockWorkspace = useCallback(
    (passphrase: string, remember: boolean = true) => {
      const cleanPassphrase = passphrase.trim();
      if (!cleanPassphrase) return;

      setWorkspacePassphrase(cleanPassphrase);

      if (typeof window !== "undefined") {
        if (currentWorkspaceId) {
          sessionStorage.setItem(`${STORAGE_PREFIX.WORKSPACE}${currentWorkspaceId}`, cleanPassphrase);
          if (remember) {
            localStorage.setItem(`${STORAGE_PREFIX.WORKSPACE}${currentWorkspaceId}`, cleanPassphrase);
          } else {
            localStorage.removeItem(`${STORAGE_PREFIX.WORKSPACE}${currentWorkspaceId}`);
          }
        }
        // Also persist globally if remember is chosen
        if (remember) {
          localStorage.setItem(STORAGE_PREFIX.GLOBAL, cleanPassphrase);
        }
        window.dispatchEvent(new CustomEvent("xtra-vault-change", { detail: { workspaceId: currentWorkspaceId, scope: "workspace" } }));
      }
    },
    [currentWorkspaceId]
  );

  const lockWorkspace = useCallback(() => {
    setWorkspacePassphrase("");

    if (typeof window !== "undefined") {
      if (currentWorkspaceId) {
        sessionStorage.removeItem(`${STORAGE_PREFIX.WORKSPACE}${currentWorkspaceId}`);
        localStorage.removeItem(`${STORAGE_PREFIX.WORKSPACE}${currentWorkspaceId}`);
      }
      sessionStorage.removeItem(STORAGE_PREFIX.GLOBAL);
      localStorage.removeItem(STORAGE_PREFIX.GLOBAL);
      window.dispatchEvent(new CustomEvent("xtra-vault-change", { detail: { workspaceId: currentWorkspaceId, locked: true } }));
    }
  }, [currentWorkspaceId]);

  const setProjectPassphrase = useCallback((projectId: string, passphrase: string, remember: boolean = true) => {
    const clean = passphrase.trim();
    if (!projectId || !clean) return;

    if (typeof window !== "undefined") {
      sessionStorage.setItem(`${STORAGE_PREFIX.PROJECT}${projectId}`, clean);
      if (remember) {
        localStorage.setItem(`${STORAGE_PREFIX.PROJECT}${projectId}`, clean);
      } else {
        localStorage.removeItem(`${STORAGE_PREFIX.PROJECT}${projectId}`);
      }
      window.dispatchEvent(new CustomEvent("xtra-vault-change", { detail: { projectId, scope: "project" } }));
    }
  }, []);

  const clearProjectPassphrase = useCallback((projectId: string) => {
    if (!projectId) return;

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`${STORAGE_PREFIX.PROJECT}${projectId}`);
      localStorage.removeItem(`${STORAGE_PREFIX.PROJECT}${projectId}`);
      window.dispatchEvent(new CustomEvent("xtra-vault-change", { detail: { projectId, scope: "project", cleared: true } }));
    }
  }, []);

  const getProjectVaultStatus = useCallback((projectId: string): {
    isUnlocked: boolean;
    isDedicatedProjectKey: boolean;
    source: "project" | "workspace" | "global" | "none";
    passphrase: string;
  } => {
    if (!projectId || typeof window === "undefined") {
      return { isUnlocked: false, isDedicatedProjectKey: false, source: "none", passphrase: "" };
    }

    const projKey =
      sessionStorage.getItem(`${STORAGE_PREFIX.PROJECT}${projectId}`) ||
      localStorage.getItem(`${STORAGE_PREFIX.PROJECT}${projectId}`);
    if (projKey) {
      return { isUnlocked: true, isDedicatedProjectKey: true, source: "project", passphrase: projKey };
    }

    if (workspacePassphrase) {
      return { isUnlocked: true, isDedicatedProjectKey: false, source: "workspace", passphrase: workspacePassphrase };
    }

    if (currentWorkspaceId) {
      const wsKey =
        sessionStorage.getItem(`${STORAGE_PREFIX.WORKSPACE}${currentWorkspaceId}`) ||
        localStorage.getItem(`${STORAGE_PREFIX.WORKSPACE}${currentWorkspaceId}`);
      if (wsKey) {
        return { isUnlocked: true, isDedicatedProjectKey: false, source: "workspace", passphrase: wsKey };
      }
    }

    const globalKey =
      sessionStorage.getItem(STORAGE_PREFIX.GLOBAL) ||
      localStorage.getItem(STORAGE_PREFIX.GLOBAL);
    if (globalKey) {
      return { isUnlocked: true, isDedicatedProjectKey: false, source: "global", passphrase: globalKey };
    }

    return { isUnlocked: false, isDedicatedProjectKey: false, source: "none", passphrase: "" };
  }, [currentWorkspaceId, workspacePassphrase]);

  const resolveEffectivePassphrase = useCallback(
    (projectId?: string): { passphrase: string; source: "project" | "workspace" | "global" | "default" | "none" } => {
      if (typeof window === "undefined") {
        return { passphrase: "", source: "none" };
      }

      // 1. Check Project-Specific Key first (isolated override)
      if (projectId) {
        const projectKey =
          sessionStorage.getItem(`${STORAGE_PREFIX.PROJECT}${projectId}`) ||
          localStorage.getItem(`${STORAGE_PREFIX.PROJECT}${projectId}`);
        if (projectKey) {
          return { passphrase: projectKey, source: "project" };
        }
      }

      // 2. Check Active Workspace Master Key
      if (workspacePassphrase) {
        return { passphrase: workspacePassphrase, source: "workspace" };
      }

      if (currentWorkspaceId) {
        const wsKey =
          sessionStorage.getItem(`${STORAGE_PREFIX.WORKSPACE}${currentWorkspaceId}`) ||
          localStorage.getItem(`${STORAGE_PREFIX.WORKSPACE}${currentWorkspaceId}`);
        if (wsKey) {
          return { passphrase: wsKey, source: "workspace" };
        }
      }

      // 3. Check Global Storage Fallback
      const globalKey =
        sessionStorage.getItem(STORAGE_PREFIX.GLOBAL) ||
        localStorage.getItem(STORAGE_PREFIX.GLOBAL);
      if (globalKey) {
        return { passphrase: globalKey, source: "global" };
      }

      return { passphrase: "", source: "none" };
    },
    [currentWorkspaceId, workspacePassphrase]
  );

  return (
    <WorkspaceVaultContext.Provider
      value={{
        workspaceId: currentWorkspaceId,
        workspacePassphrase,
        isWorkspaceUnlocked: Boolean(workspacePassphrase),
        unlockWorkspace,
        lockWorkspace,
        setProjectPassphrase,
        clearProjectPassphrase,
        getProjectVaultStatus,
        resolveEffectivePassphrase,
      }}
    >
      {children}
    </WorkspaceVaultContext.Provider>
  );
};

export const useWorkspaceVault = () => {
  const context = useContext(WorkspaceVaultContext);
  if (!context) {
    throw new Error("useWorkspaceVault must be used within a WorkspaceVaultProvider");
  }
  return context;
};
