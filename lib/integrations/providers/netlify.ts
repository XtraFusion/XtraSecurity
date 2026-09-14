import axios from "axios";
import { BaseProvider, ProviderConnectionTestResult, ProviderSyncResult } from "./base";

export interface NetlifySyncConfig {
  siteId: string;
  accessToken: string;
  context?: ("production" | "deploy-preview" | "branch-deploy" | "dev" | "all")[];
}

/**
 * Netlify Integration Provider (N12)
 * Synchronizes secret variables to Netlify site environments.
 */
export class NetlifyProvider extends BaseProvider<NetlifySyncConfig> {
  private baseUrl = "https://api.netlify.com/api/v1";

  async testConnection(): Promise<ProviderConnectionTestResult> {
    try {
      const res = await axios.get(`${this.baseUrl}/sites/${this.config.siteId}`, {
        headers: { Authorization: `Bearer ${this.config.accessToken}` },
      });
      return {
        success: res.status === 200,
        message: `Connected to Netlify site "${res.data?.name || this.config.siteId}" successfully.`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  }

  async sync(key: string, value: string): Promise<ProviderSyncResult> {
    const contexts = this.config.context || ["all"];
    const siteUrl = `${this.baseUrl}/sites/${this.config.siteId}/env`;

    try {
      // 1. Check if variable already exists
      const { data: existingEnvs } = await axios.get(siteUrl, {
        headers: { Authorization: `Bearer ${this.config.accessToken}` },
      });

      const existingVar = Array.isArray(existingEnvs)
        ? existingEnvs.find((e: any) => e.key === key)
        : null;

      const values = contexts.map((ctx) => ({
        context: ctx,
        value,
      }));

      if (existingVar) {
        // 2. Update existing variable values
        await axios.put(
          `${siteUrl}/${encodeURIComponent(key)}`,
          { key, values },
          { headers: { Authorization: `Bearer ${this.config.accessToken}` } }
        );
      } else {
        // 3. Create new variable
        await axios.post(
          siteUrl,
          [{ key, values }],
          { headers: { Authorization: `Bearer ${this.config.accessToken}` } }
        );
      }

      return { success: true, externalId: key };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`Netlify sync failed for "${key}": ${msg}`);
    }
  }
}
