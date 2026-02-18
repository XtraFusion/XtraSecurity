
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface XtraClientOptions {
  projectId?: string;
  token?: string;
  apiUrl?: string;
  cache?: boolean; // Enable local caching
}

export class XtraClient {
  private api: AxiosInstance;
  private projectId: string;
  private cache: Map<string, string> = new Map();
  private useCache: boolean;

  constructor(options: XtraClientOptions = {}) {
    // Try to load from env or local config if not provided
    const token = options.token || process.env.XTRA_TOKEN || this.loadLocalToken();
    const apiUrl = options.apiUrl || process.env.XTRA_API_URL || 'http://localhost:3000/api';
    this.projectId = options.projectId || process.env.XTRA_PROJECT_ID || '';
    this.useCache = options.cache !== false;

    if (!token) {
        console.warn('XtraClient: No token provided. Authentication may fail.');
    }

    this.api = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private loadLocalToken(): string | undefined {
      // Logic to read from ~/.xtra/config.json or similar (simplified)
      return undefined;
  }

  async getSecret(key: string, env: string = 'development'): Promise<string | null> {
    if (this.useCache && this.cache.has(`${env}:${key}`)) {
        return this.cache.get(`${env}:${key}`) || null;
    }

    try {
        if (!this.projectId) {
            throw new Error('Project ID is required');
        }

        const response = await this.api.get(`/projects/${this.projectId}/envs/${env}/secrets/${key}`);
        
        // Assume API returns decrypted value or we handle decryption here
        // For SDK simplicity, let's assume API returns JSON with value field
        // In real impl, we'd replicate decryption logic if E2EE
        
        const secret = response.data;
        let value = "";
        
        if (secret.value && secret.value.length > 0) {
            // Decryption logic pending... for now assume raw or server-side decrypted for SDK (if allowed)
            // Or implement full AES-GCM decryption here using crypto module
            value = secret.value[0]; 
            // Mock decryption for skeleton
            try {
                const parsed = JSON.parse(value);
                if (parsed.encryptedData) {
                    value = "[ENCRYPTED]"; // SDK needs key to decrypt
                    // TODO: Implement decryption with user's encryption key
                }
            } catch (e) {}
        }

        if (this.useCache) {
            this.cache.set(`${env}:${key}`, value);
        }
        
        return value;

    } catch (error: any) {
        console.error(`Failed to fetch secret ${key}:`, error.message);
        return null;
    }
  }

  // Helper to load all secrets
  async loadSecrets(env: string = 'development'): Promise<Record<string, string>> {
      // ... implementation
      return {};
  }
}
