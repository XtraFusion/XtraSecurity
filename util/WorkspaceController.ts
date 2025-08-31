import axios from "axios";
import { Workspace } from "./Interface";

const WorkspaceController = {
    createWorkspace  :async (data:Workspace)=>{
        const { name, description, subscription, subscriptionExpire, type } = data;

        if (!name) {
            throw new Error("Name is required");
        }
        return await axios.post("/api/workspace", {
            name,
            description,
            subscription,
            subscriptionExpire: subscriptionExpire ? new Date(subscriptionExpire) : undefined,
            type
        });
    }
}