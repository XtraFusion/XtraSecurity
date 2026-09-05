import {
  generateX25519KeyPair,
  encryptSecretValue,
  decryptSecretValue,
  createWorkloadKeyEnvelope,
  decryptWorkloadKeyEnvelope,
  generateRecoveryMnemonic,
  deriveProjectKey,
  deriveLegacyBrowserProjectKey
} from '../lib/crypto/e2ee';

describe('Phase 3 Zero-Knowledge E2EE & Workload Key Envelope Suite', () => {
  const projectKeyHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  test('Scenario 1: Client AES-256-GCM local encrypt and decrypt', () => {
    const plaintextSecret = 'super-secret-db-password-123!';
    const encrypted = encryptSecretValue(plaintextSecret, projectKeyHex);

    expect(encrypted.ciphertext).not.toEqual(plaintextSecret);
    expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(encrypted.authTag).toHaveLength(32); // 16 bytes = 32 hex chars

    const decrypted = decryptSecretValue(encrypted, projectKeyHex);
    expect(decrypted).toEqual(plaintextSecret);
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

  test('Scenario 6: Backward compatibility with legacy browser-encrypted payloads', () => {
    const legacyProjId = 'proj_legacy_123';
    const legacyKey = deriveLegacyBrowserProjectKey(legacyProjId);
    const plaintext = 'super-secret-legacy-value';
    const legacyEncrypted = encryptSecretValue(plaintext, legacyKey);

    // Caller attempts to decrypt using new HKDF projectKey, but provides projectId metadata
    const newHkdfKey = deriveProjectKey(legacyProjId);
    const decrypted = decryptSecretValue(
      {
        ...legacyEncrypted,
        projectId: legacyProjId
      },
      newHkdfKey
    );

    expect(decrypted).toEqual(plaintext);
  });
});
