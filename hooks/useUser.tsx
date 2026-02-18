"use client";

import axios from "axios";
import React, { useState, createContext, useContext, useEffect } from "react";
import { useSession } from "next-auth/react";

interface UserContextType {
  user: any | null;
  setUser: React.Dispatch<React.SetStateAction<any | null>>;
  userStatus: boolean | string;
  setUserStatus: React.Dispatch<React.SetStateAction<boolean | string>>;
  loading: boolean;
  fetchUser: () => Promise<void>;
  createProject: (projectData: any) => Promise<void>;
  workspaces: any[];
  refreshWorkspaces: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | any>(
  undefined
);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any | null>(null);
  // Initialize from LocalStorage or default to null
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null);

  const [workspaces, setWorkspaces] = useState<any[]>([]);

  const fetchWorkspaces = async () => {
    try {
      const res = await axios.get("/api/workspace");
      if (res.status === 200) {
        // Map to include label/value for UI components
        const mapped = res.data.map((w: any) => ({
          ...w,
          label: w.name,
          value: w.id,
        }));
        setWorkspaces(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces", error);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchUser();
      fetchWorkspaces();
    }
  }, [status]);

  // Load workspace on mount
  useEffect(() => {
    const saved = localStorage.getItem("selectedWorkspace");
    if (saved) {
      try {
        setSelectedWorkspace(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved workspace", e);
      }
    }
  }, []);

  // Save workspace on change
  useEffect(() => {
    if (selectedWorkspace) {
      localStorage.setItem("selectedWorkspace", JSON.stringify(selectedWorkspace));
    }
  }, [selectedWorkspace]);

  const [userStatus, setUserStatus] = useState<boolean | string>(false);
  const [loading, setLoading] = useState<boolean>(false);

  async function fetchUser() {
    try {
      setLoading(true);
      const userData = await axios.get("/api/user");
      if (userData.status == 200) {
        setUser(userData.data);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  }

  //secret contoller

  //create
  const createSecret = async (secretData: any) => {
    const response = await axios.post("/api/secret", secretData);
    if (response.status === 201) {
      console.log("Secret created:", response.data);
    }
  };

  //fetch secret
  const fetchSecrets = async (branchId: string) => {
    const response = await axios.get(`/api/secret?branchId=${branchId}`);
    if (response.status === 200) {
      return response.data;
    }
    return [];
  };

  //update secret

  const updateSecret = (secretId: string, updatedData: any) => {
    return axios.put(`/api/secret?id=${secretId}`, updatedData);
  };

  //branch
  //create branch

  //fetch branch
  const fetchBranch = async (projectId: string) => {
    const response = await axios.get(`/api/branch?projectId=${projectId}`);
    if (response.status === 200) {
      return response.data;
    }
    return [];
  };

  //update branch

  //delete branch

  //end of branch

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        userStatus,
        setUserStatus,
        loading,
        fetchUser,
        createSecret,
        fetchSecrets,
        fetchBranch,
        updateSecret,
        selectedWorkspace,
        setSelectedWorkspace,
        workspaces,
        refreshWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a UserProvider");
  }
  return context;
};
