import { Branch } from "./Interface";
import axios from "axios";

export const BranchController = {
  createBranch: async function (branchData: Omit<Branch, "id" | "createdAt">) {
    try {
      const response = await axios.post("/api/branch", branchData);
      if (response.status === 201) {
        console.log("Branch created:", response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error creating branch:", error);
      throw error;
    }
  },

  deleteBranch: async function (branchId: string) {
    try {
      const response = await axios.delete(`/api/branch?id=${branchId}`);
      if (response.status === 200) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error deleting branch:", error);
      throw error;
    }
  },

  clearBranch: async function (branchId: string) {
    try {
      const response = await axios.post(`/api/branch/${branchId}/clear`);
      if (response.status === 200) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error clearing branch:", error);
      throw error;
    }
  },

  updateBranch: async function (branchId: string, data: Partial<Branch>) {
    try {
      const response = await axios.put(`/api/branch?id=${branchId}`, data);
      if (response.status === 200) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error updating branch:", error);
      throw error;
    }
  },

  fetchBranches: async function (projectId?: string) {
    try {
      const url = projectId ? `/api/branch?projectId=${projectId}` : "/api/branch";
      const response = await axios.get(url);
      return response.status === 200 ? response.data : [];
    } catch (error) {
      console.error("Error fetching branches:", error);
      return [];
    }
  }
};