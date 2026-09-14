import axios from "axios";
import { BaseProvider, ProviderConnectionTestResult, ProviderSyncResult } from "./base";

export interface VaultSyncConfig {
  vaultAddress: string; // e.g. https://vault.example.com:8200
  vaultToken: string;
  mountPath?: string; // default "secret"
  secretPath: string; // e.g. "my-app/production"
  namespace?: string; // for Vault Enterprise
}

/**
 * HashiCorp Vault KV v2 Integration Provider (N14)
 * Synchronizes secrets to HashiCorp Vault KV v2 engine.
 */
export class VaultProvider extends BaseProvider<VaultSyncConfig> {
  private get headers(): Record<string, string> {
    const h: Record<string, string> = {
      "X-Vault-Token": this.config.vaultToken,
      "Content-Type": "application/json",
    };
    if (this.config.namespace) {
      h["X-Vault-Namespace"] = this.config.namespace;
    }
    return h;
  }

  private get mountPath(): string {
    return this.config.mountPath || "secret";
  }

  private get dataUrl(): string {
    const cleanAddr = this.config.vaultAddress.replace(/\/+$/, "");
    const cleanSecretPath = this.config.secretPath.replace(/^\/+/, "");
    return `${cleanAddr}/v1/${this.mountPath}/data/${cleanSecretPath}`;
  }

  async testConnection(): Promise<ProviderConnectionTestResult> {
    const cleanAddr = this.config.vaultAddress.replace(/\/+$/, "");
    try {
      // 1. Health check
      const healthRes = await axios.get(`${cleanAddr}/v1/sys/health`, {
        validateStatus: (s) => s === 200 || s === 429 || s === 472 || s === 473,
      });

      // 2. Token lookup/self check
      const tokenRes = await axios.get(`${cleanAddr}/v1/auth/token/lookup-self`, {
        headers: this.headers,
      });

      return {
        success: true,
        message: `Connected to Vault at ${cleanAddr} (Token display name: ${tokenRes.data?.data?.display_name || "active"}).`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.errors?.join(", ") || err.message,
      };
    }
  }

  async sync(key: string, value: string): Promise<ProviderSyncResult> {
    try {
      // 1. Fetch existing secrets to merge (KV v2 atomic versioned update)
      let currentData: Record<string, string> = {};
      try {
        const getRes = await axios.get(this.dataUrl, { headers: this.headers });
        if (getRes.data?.data?.data) {
          currentData = getRes.data.data.data;
        }
      } catch (err: any) {
        // 404 is normal for first write
        if (err.response?.status !== 404) {
          throw err;
        }
      }

      // 2. Merge key-value
      currentData[key] = value;

      // 3. Write new KV v2 version
      const postRes = await axios.post(
        this.dataUrl,
        { data: currentData },
        { headers: this.headers }
      );

      const version = postRes.data?.data?.version || "1";
      return {
        success: true,
        externalId: `${this.mountPath}/${this.config.secretPath}@v${version}`,
      };
    } catch (err: any) {
      const msg = err.response?.data?.errors?.join(", ") || err.message;
      throw new Error(`HashiCorp Vault sync failed for "${key}": ${msg}`);
    }
  }
}
