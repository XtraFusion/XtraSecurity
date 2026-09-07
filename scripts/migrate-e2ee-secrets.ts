import { PrismaClient } from '../lib/generated/prisma';
import path from 'path';
import dotenv from 'dotenv';
import {
  deriveProjectKey,
  encryptSecretValue,
  decryptSecretValue
} from '../lib/crypto/e2ee';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('  XtraSecurity E2EE Cryptographic Migration Tool    ');
  console.log('  Target Standard: RFC-5869 HKDF-SHA256 + AES-GCM  ');
  console.log('====================================================\n');

  const secrets = await prisma.secret.findMany();
  console.log(`Discovered ${secrets.length} total secrets in database.\n`);

  let migratedCount = 0;
  let alreadyStandardCount = 0;
  let serverAesCount = 0;
  let errorCount = 0;

  for (const secret of secrets) {
    const rawValue = secret.value?.[0];
    if (!rawValue || typeof rawValue !== 'string' || !rawValue.startsWith('{')) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawValue);

      // 1. Check if this is an E2EE payload
      if (parsed.ciphertext && parsed.iv && parsed.authTag) {
        const projectKey = deriveProjectKey(secret.projectId);

        // Decrypt using existing fallback logic (handles legacy Murmur or current HKDF)
        let plaintext: string;
        try {
          plaintext = decryptSecretValue(parsed, projectKey);
        } catch (decErr: any) {
          console.error(`❌ Failed to decrypt secret "${secret.key}" (${secret.id}):`, decErr.message);
          errorCount++;
          continue;
        }

        // Check if already re-encrypted with standard HKDF
        if (parsed.kdf === 'hkdf-sha256') {
          alreadyStandardCount++;
          continue;
        }

        // Re-encrypt with pure RFC-5869 HKDF-SHA256
        const reEncrypted = encryptSecretValue(plaintext, projectKey);
        const newE2eeBlob = JSON.stringify({
          ciphertext: reEncrypted.ciphertext,
          iv: reEncrypted.iv,
          authTag: reEncrypted.authTag,
          workloadEnvelopes: parsed.workloadEnvelopes || [],
          projectId: secret.projectId,
          kdf: 'hkdf-sha256',
          migratedAt: new Date().toISOString()
        });

        // Also migrate any history versions if present
        let newHistory = secret.history;
        if (Array.isArray(secret.history)) {
          newHistory = secret.history.map((histItem: any) => {
            try {
              const histRaw = Array.isArray(histItem.value) ? histItem.value[0] : histItem.value;
              if (typeof histRaw === 'string' && histRaw.startsWith('{')) {
                const histParsed = JSON.parse(histRaw);
                if (histParsed.ciphertext && histParsed.iv) {
                  const histPlain = decryptSecretValue(histParsed, projectKey);
                  const histReEnc = encryptSecretValue(histPlain, projectKey);
                  return {
                    ...histItem,
                    value: [
                      JSON.stringify({
                        ciphertext: histReEnc.ciphertext,
                        iv: histReEnc.iv,
                        authTag: histReEnc.authTag,
                        workloadEnvelopes: histParsed.workloadEnvelopes || [],
                        projectId: secret.projectId,
                        kdf: 'hkdf-sha256',
                        migratedAt: new Date().toISOString()
                      })
                    ]
                  };
                }
              }
              return histItem;
            } catch (_) {
              return histItem;
            }
          });
        }

        // Update database record
        await prisma.secret.update({
          where: { id: secret.id },
          data: {
            value: [newE2eeBlob],
            history: newHistory as any
          }
        });

        // Verification: ensure the newly saved blob decrypts strictly with HKDF key
        const verifyBlob = JSON.parse(newE2eeBlob);
        const verifiedPlaintext = decryptSecretValue(verifyBlob, projectKey);
        if (verifiedPlaintext !== plaintext) {
          throw new Error(`Verification integrity check failed for secret "${secret.key}"`);
        }

        console.log(`✔ Migrated secret "${secret.key}" (${secret.id}) -> RFC-5869 HKDF-SHA256 Verified`);
        migratedCount++;
      } else if (parsed.encryptedData && parsed.iv && parsed.authTag) {
        serverAesCount++;
      }
    } catch (err: any) {
      console.error(`❌ Error migrating secret "${secret.key}" (${secret.id}):`, err.message);
      errorCount++;
    }
  }

  console.log('\n====================================================');
  console.log('  Migration Summary:');
  console.log(`  - Newly Migrated to HKDF-SHA256 : ${migratedCount}`);
  console.log(`  - Already on HKDF-SHA256        : ${alreadyStandardCount}`);
  console.log(`  - Server-side AES Secrets       : ${serverAesCount}`);
  console.log(`  - Errors Encountered            : ${errorCount}`);
  console.log('====================================================');

  if (errorCount > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Fatal migration error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
