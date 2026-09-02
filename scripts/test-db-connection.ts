import "dotenv/config";
import prisma from "../lib/db";

async function main() {
  console.log("Testing database query connection to MongoDB on port 27019...");
  try {
    const userCount = await prisma.user.count();
    console.log(`[DB SUCCESS] Connected to MongoDB! Total users in database: ${userCount}`);
  } catch (err: any) {
    console.error(`[DB ERROR] Failed to query MongoDB:`, err.message);
  }
}

main().finally(() => prisma.$disconnect());
