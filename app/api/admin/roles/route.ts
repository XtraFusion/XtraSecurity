import { NextResponse } from "next/server";
import { UserRole } from "@/lib/authz/types";

// GET /api/admin/roles - List all available roles
export async function GET() {
  const roles = [
    {
      id: UserRole.OWNER,
      name: "Owner",
      description: "Full control including billing and project deletion",
      permissions: ["All permissions"]
    },
    {
      id: UserRole.ADMIN,
      name: "Admin",
      description: "Manage users, secrets, and settings",
      permissions: ["secrets.*", "users.manage", "branches.*", "audit.*", "project.settings"]
    },
    {
      id: UserRole.DEVELOPER,
      name: "Developer",
      description: "Read/write dev & staging, read-only production",
      permissions: ["secrets.read.*", "secrets.write.dev", "secrets.write.stg", "branches.*"]
    },
    {
      id: UserRole.VIEWER,
      name: "Viewer",
      description: "Read-only access to secrets",
      permissions: ["secrets.read"]
    },
    {
      id: UserRole.GUEST,
      name: "Guest",
      description: "Temporary access via JIT requests",
      permissions: ["Requires JIT approval"]
    }
  ];

  return NextResponse.json(roles);
}
