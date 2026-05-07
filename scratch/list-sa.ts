import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sAs = await prisma.serviceAccount.findMany();
  console.log(JSON.stringify(sAs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
