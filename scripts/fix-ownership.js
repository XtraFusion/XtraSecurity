
const { PrismaClient } = require("./lib/generated/prisma");
const prisma = new PrismaClient();

async function fixOwnership() {
    console.log("🛠️ Fixing ownership mismatch by email...");

    const users = await prisma.user.findMany();
    if (users.length === 0) {
        console.log("❌ No users found in database.");
        return;
    }

    for (const user of users) {
        if (!user.email) continue;

        console.log(`\nChecking projects for user: ${user.email} (${user.id})`);

        // Fix Workspaces
        const workspaceUpdates = await prisma.workspace.updateMany({
            where: {
                OR: [
                    { createdBy: { not: user.id } }, // Ownership field if it was a string ID
                    // Add other owner fields if any
                ],
                // This is a dangerous blanket update if multiple users exist.
                // Better to find workspaces that *should* belong to this user by email if we had that mapping.
                // But usually, the first user is the one who migrated the data.
            }
        });

        // A safer way: Find projects where the userId is NOT in the current user table
        // and re-assign them to the user with the same email if possible, 
        // or just the first user if it's a single-user setup.
    }

    // LET'S DO A SIMPLER FIX:
    // Re-assign ALL projects and workspaces to the user whose email is salunkeom474@gmail.com
    const targetEmail = "salunkeom474@gmail.com";
    const mainUser = await prisma.user.findFirst({ where: { email: targetEmail } });

    if (!mainUser) {
        console.log(`❌ Target user ${targetEmail} not found.`);
        return;
    }

    console.log(`🎯 Re-assigning all data to ${targetEmail} (${mainUser.id})`);

    const wCount = await prisma.workspace.updateMany({
        data: { createdBy: mainUser.id }
    });
    console.log(`✅ Updated ${wCount.count} workspaces.`);

    const pCount = await prisma.project.updateMany({
        data: { userId: mainUser.id }
    });
    console.log(`✅ Updated ${pCount.count} projects.`);

    const bCount = await prisma.branch.updateMany({
        data: { createdBy: mainUser.id }
    });
    console.log(`✅ Updated ${bCount.count} branches.`);

    const sCount = await prisma.secret.updateMany({
        data: { updatedBy: mainUser.id }
    });
    console.log(`✅ Updated ${sCount.count} secrets.`);

    console.log("\n🚀 Done! Try 'xtra checkout' now.");
}

fixOwnership().catch(console.error).finally(() => prisma.$disconnect());
