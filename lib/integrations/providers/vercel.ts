import axios from "axios";

export interface VercelSyncConfig {
    vercelProjectId: string;
    teamId?: string;
    environment: ("production" | "preview" | "development")[];
}

export async function syncToVercel(
    key: string,
    value: string,
    accessToken: string,
    config: VercelSyncConfig
) {
    const { vercelProjectId, teamId, environment } = config;
    const baseUrl = `https://api.vercel.com/v9/projects/${vercelProjectId}/env`;
    const params = teamId ? { teamId } : {};

    // 1. Check if env var already exists
    const { data: existingEnv } = await axios.get(baseUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params
    });

    const existingVar = existingEnv.envs.find((e: any) => e.key === key);

    if (existingVar) {
        // 2. Update existing
        await axios.patch(`${baseUrl}/${existingVar.id}`, {
            value,
            target: environment
        }, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params
        });
    } else {
        // 3. Create new
        await axios.post(baseUrl, {
            key,
            value,
            type: "secret",
            target: environment
        }, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params
        });
    }

    return { success: true, externalId: existingVar?.id || "new" };
}
