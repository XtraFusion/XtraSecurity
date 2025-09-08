import apiClient from "@/lib/axios";
import { Workspace } from "./Interface";

const WorkspaceController = {
    createWorkspace: async (data: Workspace) => {
        const { name, description, subscription, subscriptionExpire, type } = data;

        if (!name) {
            throw new Error("Name is required");
        }
        
        try {
            const response = await apiClient.post("/api/workspace", {
                name,
                description,
                subscription,
                subscriptionExpire: subscriptionExpire ? new Date(subscriptionExpire) : undefined,
                type
            });
            return response.data;
        } catch (error) {
            console.error("Error creating workspace:", error);
            throw error;
        }
    }
}