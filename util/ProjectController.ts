import { Project, AccessLevel, SecurityLevel, SecuritySettings, IpRestriction } from "./Interface";
export type { AccessLevel, SecurityLevel, IpRestriction };
import { Project as PrismaProject } from "@/lib/generated/prisma";
import axios from "axios";

const CACHE_TTL = 60 * 1000; // 60 seconds
const projectCache = new Map<string, { data: any; expiry: number }>();

const clearCache = () => projectCache.clear();

export const ProjectController = {
  createProject: async function (projectData: Project | PrismaProject) {
    try {
      const response = await axios.post("/api/project", projectData);
      if (response.status === 201) {
        console.log("Project created:", response.data);
        clearCache(); // Invalidate cache
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  updateAccessLevel: async function (projectId: string, accessLevel: AccessLevel) {
    try {
      const response = await axios.patch(`/api/project/${projectId}/access`, { accessLevel });
      if (response.status === 200) {
        clearCache();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error updating access level:", error);
      throw error;
    }
  },

  updateSecurityLevel: async function (projectId: string, securityLevel: SecurityLevel) {
    try {
      const response = await axios.patch(`/api/project/${projectId}/security-level`, { securityLevel });
      if (response.status === 200) {
        clearCache();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error updating security level:", error);
      throw error;
    }
  },

  updateSecuritySettings: async function (projectId: string, settings: Partial<SecuritySettings>) {
    try {
      const response = await axios.patch(`/api/project/${projectId}/security-settings`, settings);
      if (response.status === 200) {
        clearCache();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error updating security settings:", error);
      throw error;
    }
  },

  updateIpRestrictions: async function (projectId: string, ipRestrictions: IpRestriction[]) {
    try {
      const response = await axios.patch(`/api/project/${projectId}/ip-restrictions`, { ipRestrictions });
      if (response.status === 200) {
        clearCache();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error updating IP restrictions:", error);
      throw error;
    }
  },

  addIpRestriction: async function (id: string, ipRestriction: IpRestriction) {
    try {
      const response = await axios.post(`/api/project/${id}/ip-restrictions`, ipRestriction);
      clearCache();
      return response.data;
    } catch (error) {
      console.error("Error adding IP restriction:", error);
      throw error;
    }
  },

  removeIpRestriction: async function (id: string, ip: string) {
    try {
      const response = await axios.delete(`/api/project/${id}/ip-restrictions/${ip}`);
      clearCache();
      return response.data;
    } catch (error) {
      console.error("Error removing IP restriction:", error);
      throw error;
    }
  },

  //delete project
  deleteProject: async function (id: string) {
    try {
      const response = await axios.delete(`/api/project?id=${id}`);
      clearCache();
      return response.data;
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    } 
  },

  //update project
  updateProject: async function (id: string, data: Project | PrismaProject) {
    try {
      const response = await axios.put(`/api/project?id=${id}`, data);
      if (response.status === 200) {
        console.log("Project updated:", response.data);
        clearCache();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  },

  //fetch all projects
  fetchProjects: async function (id?: string, workspaceId?: string) {
    try {
      const cacheKey = id ? `project-${id}` : `all-projects-${workspaceId || 'global'}`;
      const cached = projectCache.get(cacheKey);
      
      if (cached && Date.now() < cached.expiry) {
        console.log("Serving from cache:", cacheKey);
        return cached.data;
      }

      if (id) {
        const response = await axios.get(`/api/project?id=${id}`);
        const data = response.status === 200 ? response.data : [];
        projectCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
        return data;
      }
      
      const url = workspaceId ? `/api/project?workspaceId=${workspaceId}` : "/api/project";
      const response = await axios.get(url);
      const data = response.status === 200 ? response.data : [];
      projectCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
      return data;
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  },

  //clear project data
  clearProject: async function (id: string) {
    try {
      const response = await axios.post(`/api/project/${id}/clear`);
      clearCache();
      return response.data;
    } catch (error) {
      console.error("Error clearing project:", error);
      throw error;
    }
  },

  //toggle project block
  toggleProjectBlock: async function (id: string) {
    try {
      const response = await axios.post(`/api/project/${id}/toggle-block`);
      clearCache(); // Invalidate cache on block toggle
      return response.data;
    } catch (error) {
      console.error("Error toggling project block:", error);
      throw error;
    }
  }
};
