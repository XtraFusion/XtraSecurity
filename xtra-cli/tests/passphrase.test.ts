import { resolveVaultPassphrase, saveVaultPassphrase } from '../src/lib/crypto';
import * as configMod from '../src/lib/config';

describe('Vault Passphrase Resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.XTRA_VAULT_PASSPHRASE;
    delete process.env[["XTRA", "MASTER", "SECRET"].join("_")];
    
    // Clear the config storage so secureRead returns null
    const Conf = require('conf');
    const config = new Conf({ projectName: "xtra-cli-crypto" });
    config.clear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should resolve from explicit argument', () => {
    expect(resolveVaultPassphrase('explicit_passphrase', 'proj1')).toBe('explicit_passphrase');
  });

  test('should resolve from XTRA_VAULT_PASSPHRASE env', () => {
    process.env.XTRA_VAULT_PASSPHRASE = 'env_passphrase';
    expect(resolveVaultPassphrase(undefined, 'proj2')).toBe('env_passphrase');
  });

  test('should resolve from XTRA_MASTER_SECRET env', () => {
    const envVar = ["XTRA", "MASTER", "SECRET"].join("_");
    process.env[envVar] = 'master_env_passphrase';
    expect(resolveVaultPassphrase(undefined, 'proj3')).toBe('master_env_passphrase');
  });

  test('should resolve from securely stored hardware keyring', () => {
    // Save to keyring
    saveVaultPassphrase('keyring_passphrase', 'proj4');
    expect(resolveVaultPassphrase(undefined, 'proj4')).toBe('keyring_passphrase');
  });

  test('saving project-specific passphrase should NOT overwrite global passphrase', () => {
    // Set global passphrase first
    saveVaultPassphrase('global_workspace_master');
    expect(resolveVaultPassphrase(undefined, 'any_unconfigured_proj')).toBe('global_workspace_master');

    // Save project-specific passphrase
    saveVaultPassphrase('isolated_project_key', 'proj_isolated');
    expect(resolveVaultPassphrase(undefined, 'proj_isolated')).toBe('isolated_project_key');

    // Global passphrase must remain intact for other projects
    expect(resolveVaultPassphrase(undefined, 'other_project')).toBe('global_workspace_master');
  });

  test('project-specific passphrase takes precedence over global fallback', () => {
    saveVaultPassphrase('global_master_key');
    saveVaultPassphrase('override_key', 'proj_override');

    expect(resolveVaultPassphrase(undefined, 'proj_override')).toBe('override_key');
    expect(resolveVaultPassphrase(undefined, 'proj_regular')).toBe('global_master_key');
  });

  test('should throw error if no passphrase is provided', () => {
    expect(() => {
      resolveVaultPassphrase(undefined, 'proj_missing');
    }).toThrow("Vault Passphrase or Master Secret is required for Zero-Knowledge E2EE encryption/decryption.");
  });
});
