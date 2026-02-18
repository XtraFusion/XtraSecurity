
import prisma from '../lib/db';

async function main() {
  const project = await prisma.project.findFirst({
    select: { id: true, name: true }
  });
  if (project) {
    console.log(`PROJECT_ID=${project.id}`);
    console.log(`PROJECT_NAME=${project.name}`);
  } else {
    console.log("NO_PROJECTS_FOUND");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
