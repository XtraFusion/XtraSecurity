const { PrismaClient } = require("./lib/generated/prisma");
require("dotenv").config();
const prisma = new PrismaClient();

async function main() {
    // Find valid user (admin or from existing)
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found.");
        return;
    }

    // Find or create a project
    let project = await prisma.project.findFirst({
        where: { userId: user.id },
    });

    if (!project) {
        console.log("Creating test project...");
        // Create workspace if needed... simplifiying assuming workspace exists or optional?
        // Project model requires workspaceId.
        const workspace = await prisma.workspace.findFirst({ where: { createdBy: user.id } });
        if (!workspace) throw new Error("No workspace");

        project = await prisma.project.create({
            data: {
                name: "CLI Test Project",
                description: "Testing CLI",
                userId: user.id,
                workspaceId: workspace.id,
                secrets: {
                    create: {
                        key: "CLI_TEST_SECRET",
                        value: ["Hello-World-From-CLI"],
                        description: "Test secret",
                        environmentType: "dev",
                        type: "environment",
                        version: "1",
                        history: [],
                        updatedBy: user.id,
                        rotationPolicy: "manual"
                    }
                }
            },
        });
    } else {
        // Ensure secret exists
        const secret = await prisma.secret.findFirst({
            where: { projectId: project.id, key: "CLI_TEST_SECRET" }
        });
        if (!secret) {
            await prisma.secret.create({
                data: {
                    key: "CLI_TEST_SECRET",
                    value: ["Hello-World-From-CLI"],
                    description: "Test secret",
                    environmentType: "dev",
                    type: "environment",
                    version: "1",
                    history: [],
                    updatedBy: user.id,
                    rotationPolicy: "manual",
                    projectId: project.id
                }
            });
        }
    }

    console.log(`PROJECT_ID=${project.id}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
