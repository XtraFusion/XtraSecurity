import prisma from '../lib/db';
import path from 'path';
import dotenv from 'dotenv';
import {
  deriveProjectKey,
  encryptSecretValue,
  decryptSecretValue,
  validateProjectPassphrase
} from '../lib/crypto/e2ee';
import { decrypt } from '../lib/encription';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface MigrationOptions {
  projectId?: string;
  passphrase?: string;
  sourceSeed?: string;
  dryRun?: boolean;
}

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--projectId' && args[i + 1]) {
      options.projectId = args[i + 1];
      i++;
    } else if (args[i] === '--passphrase' && args[i + 1]) {
      options.passphrase = args[i + 1];
      i++;
    } else if (args[i] === '--sourceSeed' && args[i + 1]) {
      options.sourceSeed = args[i + 1];
      i++;
    } else if (args[i] === '--dryRun') {
      options.dryRun = true;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  console.log('====================================================');
  console.log('  XtraSecurity Level 3 Zero-Knowledge Migration     ');
  console.log('  Re-encrypt to User-Held Client Passphrase         ');
  console.log('====================================================\n');

  if (!options.passphrase) {
    console.error('❌ Error: Missing required argument --passphrase "<your-master-passphrase>"');
    console.log('\nUsage:');
    console.log('  npx ts-node scripts/reencrypt-to-level3.ts --passphrase "my-vault-passphrase" [--projectId <id>] [--dryRun]\n');
    process.exit(1);
  }

  const query: any = {};
  if (options.projectId) {
    query.projectId = options.projectId;
    console.log(`Targeting single project: ${options.projectId}`);
  } else {
    console.log('Targeting all projects in database.');
  }

  if (options.dryRun) {
    console.log('⚠ DRY-RUN MODE: No database changes will be committed.\n');
  }

  const secrets = await prisma.secret.findMany({ where: query });
  console.log(`Found ${secrets.length} candidate secrets.\n`);

  let reencryptedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const secret of secrets) {
    const rawValue = secret.value?.[0];
    if (!rawValue || typeof rawValue !== 'string' || !rawValue.startsWith('{')) {
      skippedCount++;
      continue;
    }

    try {
      const parsed = JSON.parse(rawValue);

      let plaintext: string;

      // Case A: Server-side AES payload ({ iv, encryptedData, authTag })
      if (parsed.iv && parsed.encryptedData && parsed.authTag) {
        try {
          plaintext = decrypt(parsed);
        } catch (decErr: any) {
          console.warn(`⚠ Skipping secret "${secret.key}" (${secret.id}): Could not decrypt with server ENCRYPTION_KEY.`);
          errorCount++;
          continue;
        }
      } else if (parsed.ciphertext && parsed.iv && parsed.authTag) {
        // Case B: E2EE Zero-Knowledge payload ({ iv, ciphertext, authTag })
        let sourceKey = deriveProjectKey(secret.projectId, options.sourceSeed);
        try {
          plaintext = decryptSecretValue(parsed, sourceKey);
        } catch (decErr: any) {
          // Fallback: If no explicit sourceSeed was provided, attempt browser-standard fallback key
          if (!options.sourceSeed) {
            try {
              sourceKey = deriveProjectKey(secret.projectId, 'xtra-zero-knowledge-master');
              plaintext = decryptSecretValue(parsed, sourceKey);
            } catch (_) {
              console.warn(`⚠ Skipping secret "${secret.key}" (${secret.id}): Could not decrypt with source key.`);
              errorCount++;
              continue;
            }
          } else {
            console.warn(`⚠ Skipping secret "${secret.key}" (${secret.id}): Could not decrypt with source key.`);
            errorCount++;
            continue;
          }
        }
      } else {
        skippedCount++;
        continue;
      }

      // 3. Derive new Level 3 target key using user-held master passphrase
      const targetKey = deriveProjectKey(secret.projectId, options.passphrase);

      // 4. Re-encrypt secret with target Level 3 key
      const newEncrypted = encryptSecretValue(plaintext, targetKey);
      const newPayload = JSON.stringify({
        ciphertext: newEncrypted.ciphertext,
        iv: newEncrypted.iv,
        authTag: newEncrypted.authTag,
        kdf: 'hkdf-sha256',
        level: 3,
        updatedAt: new Date().toISOString()
      });

      // 5. Verify round-trip before database write
      const testDecrypted = decryptSecretValue(newEncrypted, targetKey);
      if (testDecrypted !== plaintext) {
        throw new Error('Verification assertion failed: re-encrypted plaintext does not match original.');
      }

      // 6. Persist to MongoDB if not dry run
      if (!options.dryRun) {
        await prisma.secret.update({
          where: { id: secret.id },
          data: {
            value: [newPayload]
          }
        });
      }

      console.log(`✔ Re-encrypted: "${secret.key}" (Project: ${secret.projectId}) -> Level 3 Zero-Knowledge`);
      reencryptedCount++;
    } catch (err: any) {
      console.error(`❌ Error migrating "${secret.key}": ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n====================================================');
  console.log('  Migration Summary:');
  console.log(`  - Successfully Re-encrypted: ${reencryptedCount}`);
  console.log(`  - Skipped (Plaintext/Other) : ${skippedCount}`);
  console.log(`  - Failed / Decryption Errors: ${errorCount}`);
  console.log('====================================================\n');
}

main()
  .catch((e) => {
    console.error('Fatal error during migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
