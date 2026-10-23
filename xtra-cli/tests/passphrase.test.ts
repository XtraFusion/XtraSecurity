import { 
  resolveVaultPassphrase, 
  saveVaultPassphrase, 
  generateRecoveryMnemonic,
  deriveProjectKey,
  createVaultSentinel,
  verifyVaultSentinel,
  createWorkspaceVaultSentinel,
  verifyWorkspaceVaultSentinel,
  deriveWorkspaceKey
} from '../src/lib/crypto';
import * as configMod from '../src/lib/config';

describe('Vault Passphrase Resolution & Master Key Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.XTRA_PROJECT_PASSPHRASE;
    delete process.env.XTRA_WORKSPACE_PASSPHRASE;
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

  describe('Passphrase Resolution Hierarchy', () => {
    test('should resolve from explicit argument', () => {
      expect(resolveVaultPassphrase('explicit_passphrase', 'proj1')).toBe('explicit_passphrase');
    });

    test('should prioritize XTRA_PROJECT_PASSPHRASE over workspace and global', () => {
      process.env.XTRA_PROJECT_PASSPHRASE = 'project_passphrase';
      process.env.XTRA_WORKSPACE_PASSPHRASE = 'ws_passphrase';
      process.env.XTRA_VAULT_PASSPHRASE = 'global_passphrase';

      expect(resolveVaultPassphrase(undefined, 'proj_test', 'ws_test')).toBe('project_passphrase');
    });

    test('should prioritize XTRA_WORKSPACE_PASSPHRASE over XTRA_VAULT_PASSPHRASE', () => {
      process.env.XTRA_WORKSPACE_PASSPHRASE = 'ws_passphrase';
      process.env.XTRA_VAULT_PASSPHRASE = 'global_passphrase';

      expect(resolveVaultPassphrase(undefined, 'proj_test', 'ws_test')).toBe('ws_passphrase');
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

    test('should resolve from securely stored hardware keyring (project-specific)', () => {
      saveVaultPassphrase('keyring_passphrase', 'proj4');
      expect(resolveVaultPassphrase(undefined, 'proj4')).toBe('keyring_passphrase');
    });

    test('should resolve from workspace-level keyring when project key is absent', () => {
      saveVaultPassphrase('ws_master_pass', undefined, false, 'ws_alpha');
      expect(resolveVaultPassphrase(undefined, 'proj_unbound', 'ws_alpha')).toBe('ws_master_pass');
    });

    test('saving project-specific passphrase should NOT overwrite global passphrase', () => {
      saveVaultPassphrase('global_workspace_master');
      expect(resolveVaultPassphrase(undefined, 'any_unconfigured_proj')).toBe('global_workspace_master');

      saveVaultPassphrase('isolated_project_key', 'proj_isolated');
      expect(resolveVaultPassphrase(undefined, 'proj_isolated')).toBe('isolated_project_key');

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

  describe('BIP-39 Recovery Mnemonic Generator', () => {
    test('should generate a 24-word recovery phrase', () => {
      const { mnemonic, recoveryKey } = generateRecoveryMnemonic();
      const words = mnemonic.split(' ');
      expect(words.length).toBe(24);
      expect(recoveryKey).toBeDefined();
      expect(typeof recoveryKey).toBe('string');
      words.forEach(word => {
        expect(word.length).toBeGreaterThan(0);
        expect(typeof word).toBe('string');
      });
    });

    test('subsequent calls generate cryptographically distinct phrases', () => {
      const phrase1 = generateRecoveryMnemonic();
      const phrase2 = generateRecoveryMnemonic();
      expect(phrase1.mnemonic).not.toBe(phrase2.mnemonic);
      expect(phrase1.recoveryKey).not.toBe(phrase2.recoveryKey);
    });
  });

  describe('Zero-Knowledge Cryptographic Sentinels', () => {
    const testKey = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';

    test('createVaultSentinel and verifyVaultSentinel validate valid passphrase', () => {
      const projectKey = deriveProjectKey('proj_alpha', testKey);
      const sentinel = createVaultSentinel(projectKey);
      expect(sentinel).toBeDefined();
      expect(typeof sentinel.ciphertext).toBe('string');

      const isValid = verifyVaultSentinel(sentinel, projectKey);
      expect(isValid).toBe(true);
    });

    test('verifyVaultSentinel rejects invalid passphrase', () => {
      const projectKey = deriveProjectKey('proj_alpha', testKey);
      const sentinel = createVaultSentinel(projectKey);
      const wrongKey = deriveProjectKey('proj_alpha', 'wrong_passphrase_here');
      const isInvalid = verifyVaultSentinel(sentinel, wrongKey);
      expect(isInvalid).toBe(false);
    });

    test('createWorkspaceVaultSentinel and verifyWorkspaceVaultSentinel validate workspace key', () => {
      const wsSentinel = createWorkspaceVaultSentinel('ws_999', testKey);
      expect(wsSentinel).toBeDefined();

      const isValid = verifyWorkspaceVaultSentinel(wsSentinel, 'ws_999', testKey);
      expect(isValid).toBe(true);

      const isInvalid = verifyWorkspaceVaultSentinel(wsSentinel, 'ws_999', 'tampered_key');
      expect(isInvalid).toBe(false);
    });

    test('deriveWorkspaceKey produces deterministic 32-byte (64 hex char) key', () => {
      const key1 = deriveWorkspaceKey('ws_100', testKey);
      const key2 = deriveWorkspaceKey('ws_100', testKey);
      expect(key1.length).toBe(64);
      expect(key1).toEqual(key2);

      const keyOther = deriveWorkspaceKey('ws_200', testKey);
      expect(key1).not.toEqual(keyOther);
    });
  });
});
