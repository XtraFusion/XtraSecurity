import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function createTTLIndexes() {
  console.log("Setting up MongoDB TTL Indexes...");

  try {
    // 1. SecretShare -> expiresAt
    console.log("Creating TTL index for SecretShare...");
    await prisma.$runCommandRaw({
      createIndexes: "SecretShare",
      indexes: [
        {
          key: { expiresAt: 1 },
          name: "expiresAt_ttl",
          expireAfterSeconds: 0,
        },
      ],
    });
    console.log("✅ SecretShare TTL Index configured.");

    // 2. JitLink -> expiresAt (Mapped to "jit_links")
    console.log("Creating TTL index for jit_links...");
    await prisma.$runCommandRaw({
      createIndexes: "jit_links",
      indexes: [
        {
          key: { expiresAt: 1 },
          name: "expiresAt_ttl",
          expireAfterSeconds: 0,
        },
      ],
    });
    console.log("✅ JitLink TTL Index configured.");

    // 3. Session -> expires
    console.log("Creating TTL index for Session...");
    await prisma.$runCommandRaw({
      createIndexes: "Session",
      indexes: [
        {
          key: { expires: 1 },
          name: "expires_ttl",
          expireAfterSeconds: 0,
        },
      ],
    });
    console.log("✅ Session TTL Index configured.");

    // 4. VerificationToken -> expires
    console.log("Creating TTL index for VerificationToken...");
    await prisma.$runCommandRaw({
      createIndexes: "VerificationToken",
      indexes: [
        {
          key: { expires: 1 },
          name: "expires_ttl",
          expireAfterSeconds: 0,
        },
      ],
    });
    console.log("✅ VerificationToken TTL Index configured.");

    console.log("🎉 All TTL Indexes successfully created!");

  } catch (error) {
    console.error("❌ Failed to create TTL indices:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTTLIndexes();
