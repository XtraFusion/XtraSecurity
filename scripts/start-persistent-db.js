const fs = require('fs');
const path = require('path');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { execSync } = require('child_process');

async function main() {
  console.log("[DB INIT] Starting persistent MongoDB ReplicaSet on fixed port 27018...");
  
  const replSet = await MongoMemoryReplSet.create({
    instanceOpts: [
      {
        port: 27018,
        launchTimeout: 120000,
      }
    ],
    replSet: {
      name: 'rs0',
      count: 1,
      storageEngine: 'wiredTiger',
    },
  });

  await replSet.waitUntilRunning();
  const uri = replSet.getUri('xtrasecurity');
  console.log(`[DB SUCCESS] MongoDB replica set running continuously at: ${uri}`);

  // Create .env and .env.local with fixed DATABASE_URL
  const envContent = `DATABASE_URL="${uri}"\nNEXTAUTH_SECRET="e2e-test-nextauth-secret-key-32-chars-long"\nNEXTAUTH_URL="http://localhost:3000"\nNODE_ENV="development"\nXTRA_SECURITY_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"\n`;
  
  fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent, 'utf8');
  fs.writeFileSync(path.join(__dirname, '..', '.env.local'), envContent, 'utf8');
  console.log(`[ENV STORED] Updated .env and .env.local with active MongoDB URI`);

  // Run Prisma db push & seed users
  try {
    console.log("[PRISMA] Pushing schema to MongoDB...");
    execSync(`npx prisma db push`, { stdio: 'inherit', env: { ...process.env, DATABASE_URL: uri } });
    
    console.log("[PRISMA] Seeding test users into MongoDB...");
    execSync(`npx tsx scripts/run-seed-users.ts`, { stdio: 'inherit', env: { ...process.env, DATABASE_URL: uri } });
  } catch (e) {
    console.error("[PRISMA ERROR]", e.message);
  }

  console.log("\n======================================================");
  console.log("[READY] MongoDB on port 27018 is active & fully seeded!");
  console.log("======================================================");
}

main().catch(err => {
  console.error("Failed to start persistent MongoDB:", err);
  process.exit(1);
});
