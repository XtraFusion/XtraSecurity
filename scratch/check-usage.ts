import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log("--- Daily API Usage Stats ---");
  
  const usage = await prisma.dailyUsage.findMany({
    where: {
      date: {
        gte: today
      }
    },
    orderBy: {
      requests: 'desc'
    }
  });

  if (usage.length === 0) {
    console.log("No usage recorded for today yet.");
  } else {
    console.table(usage.map((u: any) => ({
      workspaceId: u.workspaceId,
      requests: u.requests,
      date: u.date.toISOString().split('T')[0]
    })));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
