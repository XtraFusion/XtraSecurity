
const { PrismaClient } = require("./lib/generated/prisma");
const prisma = new PrismaClient();

const EMAIL = "salunkeom474@gmail.com";
const PROJECT_ID = "69777bc32b12bd573520520e";
const ROLE_NAME = "admin"; // or 'developer'

async function main() {
    // 1. Find User
    const user = await prisma.user.findUnique({
        where: { email: EMAIL }
    });

    if (!user) {
        console.error(`User not found: ${EMAIL}`);
        return;
    }
    console.log(`Found User: ${user.id}`);

    // 2. Find Role
    const role = await prisma.role.findUnique({
        where: { name: ROLE_NAME }
    });

    if (!role) {
        console.error(`Role not found: ${ROLE_NAME}. Please run seed-rbac.`);
        return;
    }
    console.log(`Found Role: ${role.id}`);

    // 3. Assign Role to User for Project
    try {
        const userRole = await prisma.userRole.upsert({
            where: {
                userId_roleId_projectId: {
                    userId: user.id,
                    roleId: role.id,
                    projectId: PROJECT_ID
                }
            },
            update: {},
            create: {
                userId: user.id,
                roleId: role.id,
                projectId: PROJECT_ID
            }
        });
        console.log(`Successfully assigned ${ROLE_NAME} to user for project ${PROJECT_ID}`);
    } catch (e) {
        console.error("Failed to assign role:", e);
    }

}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
