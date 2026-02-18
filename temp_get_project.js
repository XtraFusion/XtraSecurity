
const { PrismaClient } = require("./lib/generated/prisma");
const prisma = new PrismaClient();

async function main() {
    const project = await prisma.project.findFirst({
        where: { workspaceId: "697777272b12bd5735205208" }
    });
    if (project) {
        console.log(project.id);
    } else {
        console.log("No project found");
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
