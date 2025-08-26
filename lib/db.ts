import { PrismaClient } from './generated/prisma';

declare global {
  // For Next.js hot reload, prevent multiple PrismaClients being instantiated
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
