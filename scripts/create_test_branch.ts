
import prisma from "../lib/db";

async function main() {
  const projectId = "69777bc32b12bd573520520e"; // Using the known project ID
  const branchName = "cli-test-branch";

  console.log(`Creating branch '${branchName}' for project ${projectId}...`);

  try {
    // Check if exists
    const existing = await prisma.branch.findFirst({
        where: { projectId, name: branchName }
    });

    if (existing) {
        console.log("Branch already exists:", existing.id);
        return;
    }

    const branch = await prisma.branch.create({
      data: {
        name: branchName,
        projectId: projectId,
        createdBy: "69777bc32b12bd573520520e", // Using a fake/system ID here or reusing project ID temporarily as I don't have a user ID handy easily, but schema says ObjectId. Let's use the project ID as user ID since they are both objectIds, hoping FK constraint doesn't fail. Use a valid ObjectId. 
        // Wait, createdBy refers to nothing? No relation defined in model. Ah "createdBy String @db.ObjectId". No relation.
        // But wait, in schema: "createdBy String @db.ObjectId". No relation to User?
        // Let's look at schema again. 
        // model Branch: createdBy String @db.ObjectId. No @relation.
        // So any ObjectId string works.
        description: "Created for CLI testing",
        versionNo: "1",
        permissions: []
      }
    });

    console.log("Branch created:", branch.id);
  } catch (e) {
    console.error("Error creating branch:", e);
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
