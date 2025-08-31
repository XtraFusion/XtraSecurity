import axios from "axios";
import { Project } from "./Interface";

export const ProjectController = {
  createProject: async function (projectData: Project) {
    const response = await axios.post("/api/project", projectData);
    if (response.status === 201) {
      console.log("Project created:", response.data);
    }
  },

  //fetch all projects
  fetchProjects: async function (id: string) {
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
  },
};
