const { PrismaClient } = require('../lib/generated/diag_prisma');
const prisma = new PrismaClient();
// const { PolicyEngine } = require('../lib/authz/policy-engine'); // This might fail if it uses relative imports to main prisma

async function main() {
  const userId = 'sa_69fc579d68a6dcffd9616dc3';
  const projectId = '69a7cffeed38bb77b2ddfa97';
  
  // We need to mock prisma in PolicyEngine if we use the main one.
  // Actually, let's just copy the logic here to test.
  
  const saId = userId.replace("sa_", "");
  console.log(`Testing SA: ${saId} for project: ${projectId}`);
  
  const sa = await prisma.serviceAccount.findUnique({ where: { id: saId }});
  console.log(`Found SA: ${sa ? sa.name : 'null'}, Linked Project: ${sa?.projectId}`);
  
  if (sa && (!projectId || sa.projectId === projectId)) {
      console.log("MATCH FOUND!");
      if (sa.projectId === projectId) console.log("Project IDs match exactly as strings.");
  } else {
      console.log("NO MATCH!");
      if (sa && sa.projectId !== projectId) {
          console.log(`Mismatch: DB='${sa.projectId}' vs REQ='${projectId}'`);
          console.log(`Types: DB=${typeof sa.projectId} vs REQ=${typeof projectId}`);
      }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
