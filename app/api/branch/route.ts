import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { decrypt } from "@/lib/encription";

// Helper function to check authentication
// GET /api/branch - Get all branches or filter by projectId
export async function GET(request: NextRequest) {
  try {
     const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const branches = await prisma.branch.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: true,
        secrets: true
      }
    });

    // Decrypt secret values in each branch
    const branchesWithDecryptedSecrets = branches.map((branch) => ({
      ...branch,
      secrets: branch.secrets?.map((secret) => {
        try {
          const encryptedString = secret.value[0];
          const encryptedObject = JSON.parse(encryptedString);
          const decryptedValue = decrypt(encryptedObject);
          return {
            ...secret,
            value: decryptedValue,
          };
        } catch (error) {
          console.error(`Failed to decrypt secret ${secret.id}:`, error);
          return {
            ...secret,
            value: "[Decryption failed]",
          };
        }
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get("operation");
    const branchId = searchParams.get("branchId");

    if (operation === "clear" && branchId) {
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
        createdBy: session.user.id,
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
     const session = await getServerSession(authOptions);
if (!session?.user?.email) {
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
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

