import prisma from "../lib/db";

async function cleanAllTestProjects() {
  console.log("Cleaning up projects and dependencies in MongoDB Atlas...");

  // Find all test project IDs or all projects
  const allProjects = await prisma.project.findMany({
    select: { id: true, name: true }
  });

  console.log(`Total projects in database: ${allProjects.length}`);

  const projectIds = allProjects.map(p => p.id);

  if (projectIds.length > 0) {
    console.log("Cleaning dependent records...");
    await prisma.secretSync.deleteMany({});
    await prisma.secretShare.deleteMany({});
    await prisma.rotationLog.deleteMany({});
    await prisma.rotationSchedule.deleteMany({});
    await prisma.serviceAccount.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.accessRequest.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.breakGlassSession.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.webhook.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.userRole.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.teamProject.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.secret.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.branch.deleteMany({ where: { projectId: { in: projectIds } } });

    const deletedProjects = await prisma.project.deleteMany({
      where: { id: { in: projectIds } }
    });
    console.log(`Successfully deleted ${deletedProjects.count} projects.`);
  }

  // Update ALL workspaces to enterprise plan with 999,999 project limit
  const updatedWorkspaces = await prisma.workspace.updateMany({
    data: {
      subscriptionPlan: "enterprise",
      projectLimit: 999999
    }
  });

  // Update ALL users to enterprise tier
  const updatedUsers = await prisma.user.updateMany({
    data: {
      tier: "enterprise"
    }
  });

  console.log(`Updated ${updatedWorkspaces.count} workspaces to enterprise tier with projectLimit=999999.`);
  console.log(`Updated ${updatedUsers.count} users to enterprise tier.`);
  process.exit(0);
}

cleanAllTestProjects().catch(err => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
