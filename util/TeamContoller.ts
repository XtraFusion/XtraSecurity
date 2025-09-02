


import axios from "axios";


export const TeamController = {
    createTeam: async (teamData: any) => {
        try {
            const response = await axios.post("/api/team", teamData);
            return response.data;
        } catch (error) {
            console.error("Error creating team:", error);
            throw error;
        }
    },
    getTeams: async () => {
        try {
            const response = await axios.get("/api/teams");
            return response.data;
        } catch (error) {
            console.error("Error fetching teams:", error);
            throw error;
        }
    },
    deleteTeam: async (teamId: string) => {
        try {
            const response = await axios.delete(`/api/teams/${teamId}`);
            return response.data;
        } catch (error) {
            console.error("Error deleting team:", error);
            throw error;
        }
    },
};
