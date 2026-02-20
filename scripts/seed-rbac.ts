
import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting RBAC seeding...");

  // 1. Create Permissions
  const permissionsData = [
    // Secret
    { resource: 'secret', action: 'metadata.read' },
    { resource: 'secret', action: 'value.read' }, 
    { resource: 'secret', action: 'create' },
    { resource: 'secret', action: 'update' },
    { resource: 'secret', action: 'delete' },
    { resource: 'secret', action: 'delete.hard' },
    { resource: 'secret', action: 'rotate' },
    // Audit
    { resource: 'audit', action: 'read.own' },
    { resource: 'audit', action: 'read.all' },
    { resource: 'audit', action: 'export' },
    // Project
    { resource: 'project', action: 'create' },
    { resource: 'project', action: 'delete' },
    { resource: 'project', action: 'manage.members' },
    { resource: 'project', action: 'manage.members' },
    { resource: 'project', action: 'read' }, 
    // Access Review
    { resource: 'access_review', action: 'read' },
    { resource: 'access_review', action: 'write' },
    { resource: 'access_review', action: 'start_cycle' }, 
  ];

  const permissions: Record<string, any> = {};

  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: {
        resource_action: { resource: p.resource, action: p.action }
      },
      update: {},
      create: {
        resource: p.resource,
        action: p.action
      }
    });
    permissions[`${p.resource}.${p.action}`] = perm;
  }
  console.log(`Synced ${Object.keys(permissions).length} permissions.`);

  // 2. Create Roles
  const rolesData = ["viewer", "developer", "admin"];
  const roles: Record<string, any> = {};

  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r, isSystem: true, description: `Default ${r} role` }
    });
    roles[r] = role;
  }
  console.log("Synced roles.");

  // 3. Assign Permissions to Roles
  const grant = async (roleName: string, permissionKey: string, env = "all", constraints: any = null) => {
      const role = roles[roleName];
      const perm = permissions[permissionKey];
      if (!perm) { 
          console.warn(`Permission ${permissionKey} not found!`); 
          return; 
      }

      const existing = await prisma.rolePermission.findUnique({
          where: { 
              roleId_permissionId_environment: {
                  roleId: role.id,
                  permissionId: perm.id,
                  environment: env 
              }
          }
      });

      if (!existing) {
          await prisma.rolePermission.create({
              data: {
                  roleId: role.id,
                  permissionId: perm.id,
                  environment: env,
                  constraints: constraints || undefined
              }
          });
      }
  };

  await grant("viewer", "secret.metadata.read");
  await grant("viewer", "audit.read.own");
  await grant("viewer", "project.read");

  await grant("developer", "secret.metadata.read");
  await grant("developer", "audit.read.own");
  await grant("developer", "project.read");
  await grant("developer", "project.create");
  await grant("developer", "secret.value.read", "development");
  await grant("developer", "secret.create", "development");
  await grant("developer", "secret.update", "development");
  await grant("developer", "secret.rotate", "development");

  for (const key of Object.keys(permissions)) {
      if (key !== "secret.delete.hard") {
        await grant("admin", key, "all");
      }
  }
  await grant("admin", "secret.delete.hard", "all", { requires_dual_auth: true });

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
