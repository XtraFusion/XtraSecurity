import { PrismaClient } from './lib/generated/prisma';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const workspace = await prisma.workspace.findFirst();
    if (workspace) {
      console.log('FOUND_WORKSPACE_ID:', workspace.id);
      console.log('FOUND_WORKSPACE_NAME:', workspace.name);
    } else {
      console.log('NO_WORKSPACES_FOUND');
    }
  } catch (error) {
    console.error('ERROR_CHECKING_DATA:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
