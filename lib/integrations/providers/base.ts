/**
 * Standardized Integration Provider Base Interface & Abstract Class (N09)
 */

export interface ProviderConnectionTestResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ProviderSyncResult {
  success: boolean;
  externalId?: string;
  message?: string;
}

export abstract class BaseProvider<TConfig = any> {
  protected config: TConfig;

  constructor(config: TConfig) {
    this.config = config;
  }

  /**
   * Tests whether credentials and target endpoint are valid and reachable.
   */
  abstract testConnection(): Promise<ProviderConnectionTestResult>;

  /**
   * Synchronizes a single secret key-value pair to the remote destination.
   */
  abstract sync(key: string, value: string): Promise<ProviderSyncResult>;

  /**
   * Gracefully tears down any open network sessions or client pools.
   */
  async disconnect(): Promise<void> {
    // Default no-op, can be overridden by socket/pool providers
  }
}
