import {
  generateX25519KeyPair,
  encryptSecretValue,
  decryptSecretValue,
  createWorkloadKeyEnvelope,
  decryptWorkloadKeyEnvelope,
  generateRecoveryMnemonic,
  deriveProjectKey,
  getMasterSecret,
  validateProjectPassphrase,
  createVaultSentinel,
  verifyVaultSentinel
} from '../lib/crypto/e2ee';

describe('Phase 3 Zero-Knowledge E2EE & Workload Key Envelope Suite', () => {
  const projectKeyHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  test('Scenario 1: Client AES-256-GCM local encrypt and decrypt', () => {
    const samplePlaintext = ['super', 'vault', 'db', 'password-123!'].join('-');
    const encrypted = encryptSecretValue(samplePlaintext, projectKeyHex);

    expect(encrypted.ciphertext).not.toEqual(samplePlaintext);
    expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(encrypted.authTag).toHaveLength(32); // 16 bytes = 32 hex chars

    const decrypted = decryptSecretValue(encrypted, projectKeyHex);
    expect(decrypted).toEqual(samplePlaintext);
  });

  test('Scenario 2: Workload Key Envelope Protocol (X25519 ECDH Key Wrapping)', () => {
    // Generate recipient (workload/CI) X25519 keypair
    const workloadKeyPair = generateX25519KeyPair();
    expect(workloadKeyPair.publicKey).toContain('BEGIN PUBLIC KEY');
    expect(workloadKeyPair.privateKey).toContain('BEGIN PRIVATE KEY');

    // Admin creates Workload Key Envelope for the project key
    const envelope = createWorkloadKeyEnvelope(projectKeyHex, workloadKeyPair.publicKey);
    expect(envelope.encryptedProjectKey).toBeDefined();
    expect(envelope.ephemeralPublicKey).toBeDefined();

    // Workload decrypts project key using private key
    const decryptedProjectKey = decryptWorkloadKeyEnvelope(
      envelope,
      workloadKeyPair.privateKey
    );

    expect(decryptedProjectKey).toEqual(projectKeyHex);
  });

  test('Scenario 3: 24-Word Emergency Recovery Mnemonic Generation', () => {
    const recovery = generateRecoveryMnemonic();
    const words = recovery.mnemonic.split(' ');

    expect(words).toHaveLength(24);
    expect(recovery.recoveryKey).toHaveLength(64); // 32 bytes hex
  });

  test('Scenario 4: HKDF-SHA256 deterministic Project Key Derivation', () => {
    const key1 = deriveProjectKey('proj_123456');
    const key2 = deriveProjectKey('proj_123456');
    const key3 = deriveProjectKey('proj_different');

    expect(key1).toHaveLength(64);
    expect(key1).toEqual(key2);
    expect(key1).not.toEqual(key3);
  });

  test('Scenario 5: AES-256-GCM Cryptographic Integrity & Tamper Detection', () => {
    const encrypted = encryptSecretValue('confidential-payload', projectKeyHex);

    // Tamper with ciphertext by altering the last hex character
    const tamperedCiphertext =
      encrypted.ciphertext.slice(0, -1) + (encrypted.ciphertext.endsWith('a') ? 'b' : 'a');

    expect(() => {
      decryptSecretValue(
        {
          ...encrypted,
          ciphertext: tamperedCiphertext,
        },
        projectKeyHex
      );
    }).toThrow();
  });

  test('Scenario 6: Pure RFC-5869 HKDF Master Secret configuration & isolation', () => {
    const projId = 'proj_enterprise_123';
    const defaultKey = deriveProjectKey(projId);
    const customKey = deriveProjectKey(projId, 'custom-workspace-passphrase-seed');

    expect(defaultKey).toHaveLength(64);
    expect(customKey).toHaveLength(64);
    expect(defaultKey).not.toEqual(customKey);

    const plaintext = 'top-secret-enterprise-config';
    const encrypted = encryptSecretValue(plaintext, customKey);

    // Verifies that pure AES-GCM fails closed when attempted with the wrong key
    expect(() => {
      decryptSecretValue(encrypted, defaultKey);
    }).toThrow();

    // Verifies that pure AES-GCM succeeds with the authorized key
    const decrypted = decryptSecretValue(encrypted, customKey);
    expect(decrypted).toEqual(plaintext);
  });

  test('Scenario 7: Level 3 Passphrase Validation (validateProjectPassphrase)', () => {
    const projId = 'proj_zero_knowledge_level3';
    const userPassphrase = 'correct-horse-battery-staple-vault-secret';
    const wrongPassphrase = 'incorrect-password-attempt';

    const correctKey = deriveProjectKey(projId, userPassphrase);
    const wrongKey = deriveProjectKey(projId, wrongPassphrase);

    const encrypted = encryptSecretValue('level3-confidential-secret', correctKey);

    // Correct passphrase validation succeeds
    expect(validateProjectPassphrase(encrypted, correctKey)).toBe(true);

    // Incorrect passphrase validation safely returns false without throwing unhandled exception
    expect(validateProjectPassphrase(encrypted, wrongKey)).toBe(false);
  });

  test('Scenario 8: Sentinel creation and zero-knowledge verification (prevents old/wrong keys from unlocking)', () => {
    const projId = 'proj_sentinel_test';
    const oldPassphrase = 'old-master-passphrase-word-one-two-three';
    const newPassphrase = 'new-master-passphrase-word-four-five-six';

    const oldKey = deriveProjectKey(projId, oldPassphrase);
    const newKey = deriveProjectKey(projId, newPassphrase);

    // When the project key is rotated, sentinel is encrypted with the NEW key
    const sentinel = createVaultSentinel(newKey);
    expect(sentinel.ciphertext).toBeDefined();
    expect(sentinel.iv).toBeDefined();
    expect(sentinel.authTag).toBeDefined();

    // Verification with NEW key must succeed
    expect(verifyVaultSentinel(sentinel, newKey)).toBe(true);

    // Verification with OLD key MUST fail (rejecting the old passphrase)
    expect(verifyVaultSentinel(sentinel, oldKey)).toBe(false);

    // Verification with random wrong key MUST fail
    const randomKey = deriveProjectKey(projId, 'random-unrelated-key');
    expect(verifyVaultSentinel(sentinel, randomKey)).toBe(false);
  });

  test('Scenario 9: Master Key Rotation with Secret & Sentinel Re-encryption', () => {
    const projId = 'proj_rotation_lifecycle';
    const oldPassphrase = 'initial-vault-passphrase-123';
    const newPassphrase = 'rotated-vault-passphrase-456';

    const oldKey = deriveProjectKey(projId, oldPassphrase);
    const newKey = deriveProjectKey(projId, newPassphrase);

    // Initial payload and sentinel encrypted with old key
    const samplePayload = 'DATABASE_URL=postgres://user:pass@db:5432/prod';
    const oldEncryptedData = encryptSecretValue(samplePayload, oldKey);
    const oldSentinel = createVaultSentinel(oldKey);

    expect(verifyVaultSentinel(oldSentinel, oldKey)).toBe(true);
    expect(decryptSecretValue(oldEncryptedData, oldKey)).toEqual(samplePayload);

    // Simulation of Rotation: Decrypt payload with old key, re-encrypt with new key, create new sentinel
    const decryptedForRotation = decryptSecretValue(oldEncryptedData, oldKey);
    const newEncryptedData = encryptSecretValue(decryptedForRotation, newKey);
    const newSentinel = createVaultSentinel(newKey);

    // After rotation:
    // 1. Old key CANNOT decrypt the rotated payload (throws AEAD tag error)
    expect(() => decryptSecretValue(newEncryptedData, oldKey)).toThrow();

    // 2. Old key fails sentinel verification
    expect(verifyVaultSentinel(newSentinel, oldKey)).toBe(false);

    // 3. New key verifies sentinel and decrypts payload cleanly
    expect(verifyVaultSentinel(newSentinel, newKey)).toBe(true);
    expect(decryptSecretValue(newEncryptedData, newKey)).toEqual(samplePayload);
  });
});

