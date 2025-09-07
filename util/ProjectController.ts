import apiClient from "@/lib/axios";
import { Project } from "./Interface";

export const ProjectController = {
  createProject: async function (projectData: Project) {
    try {
      const response = await apiClient.post("/api/project", projectData);
      if (response.status === 201) {
        console.log("Project created:", response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  //fetch all projects
  fetchProjects: async function (id: string) {
    try {
      if (id) {
        const response = await apiClient.get(`/api/project?id=${id}`);
        if (response.status === 200) {
          console.log("Fetched projects:", response.data);
          return response.data;
        } else {
          return [];
        }
      } else {
        const response = await apiClient.get(`/api/project`);
        if (response.status === 200) {
          return response.data;
        } else {
          return [];
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },
};
