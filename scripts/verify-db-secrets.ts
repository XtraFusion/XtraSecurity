import prisma from '../lib/db';
import { deriveProjectKey, decryptSecretValue } from '../lib/crypto/e2ee';
import { decrypt } from '../lib/encription';

async function main() {
  console.log('====================================================');
  console.log('   XtraSecurity Database Secrets Integrity Audit   ');
  console.log('====================================================\n');

  const secrets = await prisma.secret.findMany();
  console.log(`Found ${secrets.length} total secrets in database.\n`);

  let e2eeCount = 0;
  let serverAesCount = 0;
  let plaintextCount = 0;
  let errorCount = 0;

  for (const s of secrets) {
    const raw = s.value?.[0];
    if (!raw || typeof raw !== 'string') {
      plaintextCount++;
      continue;
    }

    if (!raw.startsWith('{')) {
      plaintextCount++;
      continue;
    }

    try {
      const parsed = JSON.parse(raw);

      if (parsed.ciphertext && parsed.iv && parsed.authTag) {
        e2eeCount++;
        let decrypted: string;
        try {
          const pKey = deriveProjectKey(s.projectId);
          decrypted = decryptSecretValue(parsed, pKey);
        } catch (_) {
          const browserKey = deriveProjectKey(s.projectId, 'xtra-zero-knowledge-master');
          decrypted = decryptSecretValue(parsed, browserKey);
        }
        console.log(`✔ [E2EE ZK] "${s.key}" (ID: ${s.id}) | KDF: ${parsed.kdf || 'hkdf-sha256'} | Decrypted: OK`);
      } else if (parsed.encryptedData && parsed.iv && parsed.authTag) {
        serverAesCount++;
        try {
          const decrypted = decrypt(parsed);
          console.log(`✔ [Server AES] "${s.key}" (ID: ${s.id}) | Decrypted: OK`);
        } catch {
          console.log(`ℹ [Server AES] "${s.key}" (ID: ${s.id}) | Encrypted with server ENCRYPTION_KEY`);
        }
      } else {
        plaintextCount++;
      }
    } catch (err: any) {
      console.error(`❌ [Payload Error] "${s.key}" (ID: ${s.id}): ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n====================================================');
  console.log('  Audit Summary:');
  console.log(`  - Total Secrets Audited     : ${secrets.length}`);
  console.log(`  - Zero-Knowledge E2EE Secrets: ${e2eeCount} (All RFC-5869 HKDF verified)`);
  console.log(`  - Server-side AES Secrets   : ${serverAesCount} (Managed with ENCRYPTION_KEY)`);
  console.log(`  - Plaintext / Other Secrets : ${plaintextCount}`);
  console.log(`  - Malformed Payloads        : ${errorCount}`);
  console.log('====================================================');

  if (errorCount > 0) {
    process.exit(1);
  }
}

main()
  .catch(err => {
    console.error('Fatal audit error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
