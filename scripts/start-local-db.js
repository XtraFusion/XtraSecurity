const fs = require('fs');
const path = require('path');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { execSync } = require('child_process');

async function main() {
  console.log("Starting in-memory MongoDB ReplicaSet for local Next.js dev server & Playwright E2E tests...");
  
  const replSet = await MongoMemoryReplSet.create({
    instanceOpts: [{ launchTimeout: 120000 }],
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  await replSet.waitUntilRunning();
  const uri = replSet.getUri('xtrasecurity');
  console.log(`[DB SUCCESS] MongoDB running at URI: ${uri}`);

  // Create .env file with DATABASE_URL
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = `DATABASE_URL="${uri}"\nNEXTAUTH_SECRET="e2e-test-nextauth-secret-key-32-chars-long"\nNEXTAUTH_URL="http://localhost:3000"\nNODE_ENV="development"\n`;
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`[ENV STORED] Wrote DATABASE_URL to .env file`);

  // Run Prisma db push & user seed
  try {
    console.log("Pushing Prisma schema to MongoDB...");
    execSync(`npx prisma db push`, { stdio: 'inherit', env: { ...process.env, DATABASE_URL: uri } });
    
    console.log("Seeding test users into MongoDB...");
    execSync(`npx tsx scripts/run-seed-users.ts`, { stdio: 'inherit', env: { ...process.env, DATABASE_URL: uri } });
  } catch (e) {
    console.error("Prisma push or seed error:", e.message);
  }

  console.log("\n[READY] Local database is active and seeded with test users.");
  console.log("Keep this process running in background while testing!");
}

main().catch(err => {
  console.error("Failed to start local MongoDB:", err);
  process.exit(1);
});
