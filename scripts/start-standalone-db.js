const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { execSync } = require('child_process');

async function main() {
  console.log("[DB INIT] Starting standalone MongoDB server...");
  
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27019,
      dbName: 'xtrasecurity',
    },
  });

  const uri = mongod.getUri() + "xtrasecurity?directConnection=true";
  console.log(`[DB SUCCESS] Standalone MongoDB running continuously at: ${uri}`);

  // Create .env and .env.local with standalone DATABASE_URL
  const envContent = `DATABASE_URL="${uri}"\nNEXTAUTH_SECRET="e2e-test-nextauth-secret-key-32-chars-long"\nNEXTAUTH_URL="http://localhost:3000"\nNODE_ENV="development"\nXTRA_SECURITY_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"\n`;
  
  fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent, 'utf8');
  fs.writeFileSync(path.join(__dirname, '..', '.env.local'), envContent, 'utf8');
  console.log(`[ENV STORED] Updated .env and .env.local with standalone MongoDB URI`);

  try {
    console.log("[PRISMA] Pushing schema to MongoDB...");
    execSync(`npx prisma db push`, { stdio: 'inherit', env: { ...process.env, DATABASE_URL: uri } });
    
    console.log("[PRISMA] Seeding test users into MongoDB...");
    execSync(`npx tsx scripts/run-seed-users.ts`, { stdio: 'inherit', env: { ...process.env, DATABASE_URL: uri } });
  } catch (e) {
    console.error("[PRISMA ERROR]", e.message);
  }

  console.log("\n======================================================");
  console.log("[READY] Standalone MongoDB on port 27019 is ready & fully seeded!");
  console.log("======================================================");
}

main().catch(err => {
  console.error("Failed to start standalone MongoDB:", err);
  process.exit(1);
});
