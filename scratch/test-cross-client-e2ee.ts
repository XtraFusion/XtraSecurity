// Mock vscode module for standalone Node runtime
const Module = require('module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  if (request === 'vscode') {
    return __filename;
  }
  return origResolve.call(this, request, parent, isMain, options);
};
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === 'vscode' || id === __filename) {
    return {
      workspace: {
        getConfiguration: () => ({
          get: () => undefined
        })
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

import {
  deriveProjectKey as coreDerive,
  encryptSecretValue as coreEncrypt,
  decryptSecretValue as coreDecrypt
} from '../lib/crypto/e2ee';
import {
  deriveProjectKey as cliDerive,
  decryptSecretValue as cliDecrypt
} from '../xtra-cli/src/lib/crypto';
import {
  deriveProjectKey as sdkDerive,
  decryptSecretValue as sdkDecrypt
} from '../sdk/node/wrapper';
import {
  deriveProjectKey as vscodeDerive,
  decryptSecretValue as vscodeDecrypt
} from '../xtra-vscode/src/services/api';

async function runCrossClientVerification() {
  console.log('===========================================================');
  console.log('  Cross-Client Level 3 Zero-Knowledge Cryptographic Test   ');
  console.log('===========================================================\n');

  const projectId = 'proj_enterprise_zero_knowledge_789';
  const customUserPassphrase = 'correct-horse-battery-staple-vault-2026';
  const plaintext = 'DATABASE_URL="postgres://user:super_secret_pw@db.cloud.internal:5432/prod"';

  console.log('1. Testing Key Derivation across Core, CLI, SDK, and VS Code:');
  const coreKey = coreDerive(projectId, customUserPassphrase);
  const cliKey = cliDerive(projectId, customUserPassphrase);
  const sdkKey = sdkDerive(projectId, customUserPassphrase);
  const vscodeKey = vscodeDerive(projectId, customUserPassphrase);

  console.log(`   Core Web Key  : ${coreKey}`);
  console.log(`   CLI Key       : ${cliKey}`);
  console.log(`   Node SDK Key  : ${sdkKey}`);
  console.log(`   VS Code Key   : ${vscodeKey}`);

  if (coreKey !== cliKey || coreKey !== sdkKey || coreKey !== vscodeKey) {
    throw new Error('❌ FAILURE: Key derivation mismatch between clients!');
  }
  console.log('   ✔ PASSED: All 4 client key derivations are 100% cryptographically identical.\n');

  console.log('2. Testing Cross-Client Decryption Interoperability:');
  // Encrypt in Core (representing Web Browser client)
  const encryptedPayload = coreEncrypt(plaintext, coreKey);
  console.log(`   Encrypted in Web (AES-256-GCM):`);
  console.log(`   - Ciphertext: ${encryptedPayload.ciphertext.slice(0, 32)}...`);
  console.log(`   - IV        : ${encryptedPayload.iv}`);
  console.log(`   - AuthTag   : ${encryptedPayload.authTag}\n`);

  // Decrypt in CLI
  const cliDecrypted = cliDecrypt(encryptedPayload, cliKey);
  console.log(`   ✔ CLI Decrypted      : ${cliDecrypted === plaintext ? 'OK' : 'MISMATCH'}`);

  // Decrypt in SDK
  const sdkDecrypted = sdkDecrypt(encryptedPayload, sdkKey);
  console.log(`   ✔ Node SDK Decrypted : ${sdkDecrypted === plaintext ? 'OK' : 'MISMATCH'}`);

  // Decrypt in VS Code
  const vscodeDecrypted = vscodeDecrypt(encryptedPayload, vscodeKey);
  console.log(`   ✔ VS Code Decrypted  : ${vscodeDecrypted === plaintext ? 'OK' : 'MISMATCH'}`);

  if (cliDecrypted !== plaintext || sdkDecrypted !== plaintext || vscodeDecrypted !== plaintext) {
    throw new Error('❌ FAILURE: Decryption mismatch between clients!');
  }

  console.log('\n===========================================================');
  console.log('  ✔ ALL CLIENTS ARE 100% UNIFIED & VERIFIED FOR LEVEL 3!   ');
  console.log('===========================================================\n');
}

runCrossClientVerification().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
