import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { decrypt } from "@/lib/encription";


// Helper function to check authentication
// GET /api/branch - Get all branches or filter by projectId
// Force Rebuild
export async function GET(request: NextRequest) {
  try {
     const auth = await verifyAuth(request);
     if (!auth) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // Access Control & Redaction Check
    let isViewer = false;
    if (projectId) {
        const { getUserProjectRole } = await import("@/lib/permissions");
        const role = await getUserProjectRole(auth.userId, projectId);
        if (!role) {
             // If implicit access (e.g. from Team), getUserProjectRole might return null?
             // getUserProjectRole handles team logic. So if null, really no access.
             return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (role === 'viewer') isViewer = true;
    }

    const branches = await prisma.branch.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: true,
        secrets: true
      }
    });

    // Fetch user details for each branch
    const branchesWithUsers = await Promise.all(
      branches.map(async (branch) => {
        let user = null;
        if (branch.createdBy) {
          user = await prisma.user.findUnique({
            where: { id: branch.createdBy },
            select: { email: true, name: true }
          });
        }
        return { ...branch, user };
      })
    );

    // Decrypt secret values in each branch
    const branchesWithDecryptedSecrets = branchesWithUsers.map((branch) => ({
      ...branch,
      secrets: branch.secrets?.map((secret) => {
        // Redact for Viewers
        if (isViewer) {
            return {
                ...secret,
                value: "[REDACTED]",
                history: []
            };
        }

        let decryptedValue = "";
        try {
          const encryptedString = secret.value[0];
          const encryptedObject = JSON.parse(encryptedString);
          decryptedValue = decrypt(encryptedObject);
        } catch (error) {
          console.error(`Failed to decrypt secret ${secret.id}:`, error);
          decryptedValue = "[Decryption failed]";
        }

        // Decrypt history
        const decryptedHistory = Array.isArray(secret.history) ? secret.history.map((h: any) => {
            try {
                // Check if value is array (as it is in DB) or string
                const histRaw = Array.isArray(h.value) ? h.value[0] : h.value;
                if (!histRaw) return h;

                const histEncryptedObject = JSON.parse(histRaw);
                // Check if it looks like an encrypted object
                if (histEncryptedObject.iv && histEncryptedObject.encryptedData) {
                    return {
                        ...h,
                        value: decrypt(histEncryptedObject)
                    };
                }
                return h;
            } catch (e) {
                return h;
            }
        }) : secret.history;

        return {
          ...secret,
          value: decryptedValue,
          history: decryptedHistory
        };
      }) || [],
    }));

    return NextResponse.json(branchesWithDecryptedSecrets);
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}

// POST /api/branch - Create a new branch or perform branch operations
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get("operation");
    const branchId = searchParams.get("branchId");

    // Operations might need permissions too
    if (operation === "clear" && branchId) {
      // Fetch branch to check project
      const branchToClear = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branchToClear) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

      // RBAC
      const { getUserProjectRole } = await import("@/lib/permissions");
      const role = await getUserProjectRole(auth.userId, branchToClear.projectId);
      if (!role || role === 'viewer') {
           return NextResponse.json({ error: "Forbidden: Viewers cannot clear branches" }, { status: 403 });
      }

      // Clear branch operation
      await prisma.secret.deleteMany({
        where: { branchId }
      });
      return NextResponse.json({ message: "Branch cleared successfully" });
    }

    // Regular branch creation
    const body = await request.json();
    const { name, description, projectId, versionNo = "1", permissions = [] } = body;

    // Validate required fields
    if (!name || !projectId) {
      return NextResponse.json(
        { error: "Name and projectId are required" },
        { status: 400 }
      );
    }

    // RBAC: Check Project Permissions
    const { getUserProjectRole } = await import("@/lib/permissions");
    const role = await getUserProjectRole(auth.userId, projectId);
    
    if (!role) {
         return NextResponse.json({ error: "Forbidden: No access to project" }, { status: 403 });
    }
    if (role === 'viewer') {
         return NextResponse.json({ error: "Forbidden: Viewers cannot create branches" }, { status: 403 });
    }

    // Check if branch with same name exists in project
    const existingBranch = await prisma.branch.findFirst({
      where: {
        name,
        projectId
      }
    });

    if (existingBranch) {
      return NextResponse.json(
        { error: "Branch with this name already exists in the project" },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        description: description || "",
        createdBy: auth.userId,
        projectId,
        versionNo,
        permissions
      },
      include: {
        project: true
      }
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 500 }
    );
  }
}

// DELETE /api/branch - Delete a branch
export async function DELETE(request: NextRequest) {
  try {
     const auth = await verifyAuth(request);
     if (!auth) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Branch ID is required" },
        { status: 400 }
      );
    }

    // Check if branch exists
    const existingBranch = await prisma.branch.findUnique({
      where: { id }
    });

    if (!existingBranch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    // RBAC Check
    const { getUserProjectRole } = await import("@/lib/permissions");
    const role = await getUserProjectRole(auth.userId, existingBranch.projectId);
    
    if (!role || role === 'viewer') {
         return NextResponse.json({ error: "Forbidden: Viewers cannot delete branches" }, { status: 403 });
    }
    
    // Prevent deletion of main branch
    if (existingBranch.name.toLowerCase() === "main") {
      return NextResponse.json(
        { error: "Cannot delete main branch" },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "Branch deleted successfully", branch },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json(
      { error: "Failed to delete branch" },
      { status: 500 }
    );
  }
}

// PUT /api/branch - Update a branch
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, versionNo, permissions } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Branch ID is required" },
        { status: 400 }
      );
    }

    // Check if branch exists
    const existingBranch = await prisma.branch.findUnique({
      where: { id }
    });

    if (!existingBranch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingBranch.name) {
      const duplicateBranch = await prisma.branch.findFirst({
        where: {
          name,
          projectId: existingBranch.projectId,
          id: { not: id }
        }
      });

      if (duplicateBranch) {
        return NextResponse.json(
          { error: "Branch with this name already exists in the project" },
          { status: 400 }
        );
      }
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name: name || existingBranch.name,
        description: description || existingBranch.description,
        versionNo: versionNo || existingBranch.versionNo,
        permissions: permissions || existingBranch.permissions
      },
      include: {
        project: true
      }
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json(
      { error: "Failed to update branch" },
      { status: 500 }
    );
  }
}

