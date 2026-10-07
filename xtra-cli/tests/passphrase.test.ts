import { resolveVaultPassphrase, saveVaultPassphrase } from '../src/lib/crypto';
import * as configMod from '../src/lib/config';

describe('Vault Passphrase Resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.XTRA_VAULT_PASSPHRASE;
    delete process.env.XTRA_MASTER_SECRET;
    
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
    process.env.XTRA_MASTER_SECRET = 'master_env_passphrase';
    expect(resolveVaultPassphrase(undefined, 'proj3')).toBe('master_env_passphrase');
  });

  test('should resolve from securely stored hardware keyring', () => {
    // Save to keyring
    saveVaultPassphrase('keyring_passphrase', 'proj4');
    expect(resolveVaultPassphrase(undefined, 'proj4')).toBe('keyring_passphrase');
  });

  test('should throw error if no passphrase is provided', () => {
    expect(() => {
      resolveVaultPassphrase(undefined, 'proj_missing');
    }).toThrow("Vault Passphrase or Master Secret is required for Zero-Knowledge E2EE encryption/decryption.");
  });
});
