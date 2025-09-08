


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
    getTeams: async () => {
        try {
            const response = await apiClient.get("/api/team");
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
