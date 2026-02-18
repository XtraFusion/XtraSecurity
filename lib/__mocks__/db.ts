
// Mock Prisma Client
const userRole = {
    findMany: jest.fn(),
};

const accessRequest = {
    findFirst: jest.fn(),
};

const prisma = {
    userRole,
    accessRequest,
    $connect: jest.fn(),
    $disconnect: jest.fn(),
};

export default prisma;
