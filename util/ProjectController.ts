import { Project } from "./Interface";
import axios from "axios";

export const ProjectController = {
  createProject: async function (projectData: Project) {
    try {
      const response = await axios.post("/api/project", projectData);
      if (response.status === 201) {
        console.log("Project created:", response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  //delete project
  deleteProject: async function (id: string) {
    try {
           await axios.delete(`/api/project?id=${id}`);
    }
    catch (error) {
      console.error("Error deleting project:", error);
      
    } 

  },
  //update project
  updateProject:async function (id:string, data:Project) {
    try {
      const response = await axios.put(`/api/project?id=${id}`, data);
      if (response.status === 200) {
        console.log("Project updated:", response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  ,


  //fetch all projects
  fetchProjects: async function (id: string) {
    try {
      if (id) {
        const response = await axios.get(`/api/project?id=${id}`);
        if (response.status === 200) {
          console.log("Fetched projects:", response.data);
          return response.data;
        } else {
          return [];
        }
      } else {
        const response = await axios.get(`/api/project`);
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
