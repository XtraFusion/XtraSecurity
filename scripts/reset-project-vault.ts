import prisma from '../lib/db';
import dotenv from 'dotenv';
import path from 'path';
import { deriveProjectKey, encryptSecretValue, decryptSecretValue } from '../lib/crypto/e2ee';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface ResetOptions {
  projectId: string;
  newPassphrase?: string; // If omitted, resets to default Level 2 key ('xtra-zero-knowledge-master')
}

// Known plaintexts or v1 history values for recovery
const KNOWN_PLAINTEXTS: Record<string, string> = {
  'WE': 'WE',
  'SS': 'ss',
  'SD': 'SDSS',
  'AS': 'sf',
  'OM': 'om'
};

async function main() {
  const args = process.argv.slice(2);
  let projectId = '6a983e3081de1535cecec600'; // Default to Listening=Service if not specified
  let newPassphrase = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--projectId' && args[i + 1]) {
      projectId = args[i + 1];
      i++;
    } else if (args[i] === '--passphrase' && args[i + 1]) {
      newPassphrase = args[i + 1];
      i++;
    }
  }

  console.log('====================================================');
  console.log('       XtraSecurity Project Vault Reset Tool        ');
  console.log('====================================================\n');
  console.log(`Target Project ID: ${projectId}`);
  console.log(`Target Key       : ${newPassphrase ? `Custom Passphrase ("${newPassphrase}")` : 'Default Level 2 System Key'}\n`);

  const secrets = await prisma.secret.findMany({ where: { projectId } });
  console.log(`Found ${secrets.length} secrets in project.\n`);

  const targetKey = deriveProjectKey(projectId, newPassphrase || 'xtra-zero-knowledge-master');
  const defaultKey = deriveProjectKey(projectId, 'xtra-zero-knowledge-master');

  let resetCount = 0;

  for (const s of secrets) {
    const rawVal = s.value?.[0];
    if (!rawVal || !rawVal.startsWith('{')) continue;

    try {
      const parsed = JSON.parse(rawVal);
      if (!parsed.ciphertext) continue;

      // Determine plaintext
      let plaintext: string | null = null;

      // 1. Try decrypting with default key
      try {
        plaintext = decryptSecretValue(parsed, defaultKey);
      } catch (_) {}

      // 2. Try v1 history if available
      if (!plaintext && Array.isArray(s.history)) {
        for (const h of s.history) {
          try {
            const hRaw = Array.isArray(h.value) ? h.value[0] : h.value;
            if (typeof hRaw === 'string' && hRaw.startsWith('{')) {
              const hParsed = JSON.parse(hRaw);
              if (hParsed.ciphertext) {
                plaintext = decryptSecretValue(hParsed, defaultKey);
                if (plaintext) break;
              }
            }
          } catch (_) {}
        }
      }

      // 3. Fall back to known plaintexts
      if (!plaintext && KNOWN_PLAINTEXTS[s.key]) {
        plaintext = KNOWN_PLAINTEXTS[s.key];
      }

      if (plaintext) {
        const newEncrypted = encryptSecretValue(plaintext, targetKey);
        const newPayload = JSON.stringify({
          ciphertext: newEncrypted.ciphertext,
          iv: newEncrypted.iv,
          authTag: newEncrypted.authTag,
          workloadEnvelopes: parsed.workloadEnvelopes || [],
          projectId: s.projectId,
          kdf: 'hkdf-sha256',
          resetAt: new Date().toISOString()
        });

        await prisma.secret.update({
          where: { id: s.id },
          data: {
            value: [newPayload]
          }
        });

        console.log(`✔ Reset secret "${s.key}" (${s.id}) -> Successfully re-encrypted.`);
        resetCount++;
      } else {
        console.warn(`⚠ Could not recover plaintext for secret "${s.key}".`);
      }
    } catch (e: any) {
      console.error(`❌ Error resetting secret "${s.key}": ${e.message}`);
    }
  }

  console.log(`\n✔ Reset completed! ${resetCount} secrets updated.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
