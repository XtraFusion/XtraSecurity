import { PrismaClient } from './lib/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.auditLog.groupBy({
    by: ['workspaceId'],
    _count: { id: true }
  });
  console.log("Groups by workspaceId:", groups);
  
  const wid = groups.find(g => g._count.id > 1)?.workspaceId;
  if (wid) {
     console.log("Using workspaceId:", wid);
     const workspaceLogs = await prisma.auditLog.count({ where: { workspaceId: wid } });
     console.log("Logs for this workspace:", workspaceLogs);
     
     const grouped = await prisma.auditLog.groupBy({
         by: ['userId'],
         where: { workspaceId: wid },
         _count: { userId: true }
     });
     console.log("Active users grouped:", JSON.stringify(grouped, null, 2));
     
     const failed = await prisma.auditLog.count({
        where: {
            workspaceId: wid,
            OR: [
              { action: { contains: "fail" } },
              { action: { contains: "Fail" } }
            ]
        }
     });
     console.log("Failed logs:", failed);
     
     const findManyLogs = await prisma.auditLog.findMany({
       where: { workspaceId: wid },
       skip: 0,
       take: 5,
       include: { user: true }
     });
     
     // What are the IDs of the records returned?
     console.log("FindMany limit 5 returned", findManyLogs.length, "items.");
     
     const rawLogs = await prisma.auditLog.findMany({
         where: { workspaceId: wid }
     });
     console.log("Raw logs without user include:", rawLogs.length);
     
     if (rawLogs.length !== findManyLogs.length) {
         console.log("MISSING USERS DETECTED.");
     }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
