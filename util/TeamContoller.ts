


import apiClient from "@/lib/axios";

export const TeamController = {
    createTeam: async (teamData: any) => {
        try {
            const response = await apiClient.post("/api/team", teamData);
            return response.data;
        } catch (error) {
            console.error("Error creating team:", error);
            throw error;
        }
    },
    getTeams: async (workspaceId?: string) => {
        try {
            const url = workspaceId ? `/api/team?workspaceId=${workspaceId}` : "/api/team";
            const response = await apiClient.get(url);
            return response.data;
        } catch (error) {
            console.error("Error fetching teams:", error);
            throw error;
        }
    },
    deleteTeam: async (teamId: string) => {
        try {
            const response = await apiClient.delete(`/api/team/${teamId}`);
            return response.data;
        } catch (error) {
            console.error("Error deleting team:", error);
            throw error;
        }
    },
};
