import axios from "axios";
import { BaseProvider, ProviderConnectionTestResult, ProviderSyncResult } from "./base";

export interface SupabaseSyncConfig {
  projectRef: string;
  apiKey: string; // Service role key or management API token
}

/**
 * Supabase Integration Provider (N13)
 * Synchronizes project environment secrets to Supabase management API.
 */
export class SupabaseProvider extends BaseProvider<SupabaseSyncConfig> {
  private get baseUrl() {
    return `https://api.supabase.com/v1/projects/${this.config.projectRef}/secrets`;
  }

  async testConnection(): Promise<ProviderConnectionTestResult> {
    try {
      const res = await axios.get(this.baseUrl, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      return {
        success: res.status === 200,
        message: `Connected to Supabase project "${this.config.projectRef}" successfully.`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  }

  async sync(key: string, value: string): Promise<ProviderSyncResult> {
    try {
      await axios.post(
        this.baseUrl,
        [{ name: key, value }],
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return { success: true, externalId: `${this.config.projectRef}:${key}` };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`Supabase secret sync failed for "${key}": ${msg}`);
    }
  }
}
