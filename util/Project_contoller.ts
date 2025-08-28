
import axios from "axios";

interface Project{
    id: string;
    name: string;
    description: string;
    secretsCount: number;
    lastUpdated: string;
    activeBranches: string[];
    status: "active" | "inactive" | "archived";
}

export const ProjectController = {
  createProject: async (projectData: Project) => {
    // Logic to create a new project
    const data = {
        userId: "user-123",
        ...projectData
    }
    const result = await axios.post("/api/project", data);
    return result;
  },
  getProjects: async () => {
    // Logic to retrieve all projects
    const result = await axios.get("/api/project");
    return result;
  },
  updateProject: async (projectId: string, updatedData: Partial<Project>) => {
    // Logic to update a project
    const data = {
      userId: "user-123",
      ...updatedData
    }
    const result = await axios.put(`/api/project/${projectId}`, data);
    return result;
  },
  deleteProject: async (projectId: string) => {
    // Logic to delete a project
    const result = await axios.delete(`/api/project/${projectId}`);
    return result;
  },
}
