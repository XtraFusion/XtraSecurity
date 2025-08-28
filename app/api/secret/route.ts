import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/lib/auth";

// Helper function to check authentication
function getAuthFromRequest(request: NextRequest): { authenticated: boolean; user?: User } {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { authenticated: false };
    }
    return { authenticated: true, user: currentUser };
  } catch (error) {
    return { authenticated: false };
  }
}

// GET /api/secret - Get all secrets or filter by projectId
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const query = projectId ? { projectId } : {};
    const secrets = await prisma.secret.findMany({
      where: query,
      include: {
        project: true
      }
    });

    return NextResponse.json(secrets);
  } catch (error) {
    console.error("Error fetching secrets:", error);
    return NextResponse.json(
      { error: "Failed to fetch secrets" },
      { status: 500 }
    );
  }
}

// POST /api/secret - Create a new secret
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      key,
      value,
      description,
      environment_type,
      projectId,
      type,
      permission = [],
      expiryDate,
      rotationPolicy = "manual"
    } = body;

    // Validate required fields
    if (!key || !value || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new secret with version history
    const newSecret = await prisma.secret.create({
      data: {
        key,
        value,
        description,
        environment_type,
        version: "1",
        projectId,
        type,
        history: [
          {
            version: "1",
            value,
            description,
            updatedAt: new Date(),
            updatedBy: auth.user.email
          }
        ],
        updatedBy: auth.user.email,
        permission,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        rotationPolicy
      }
    });

    return NextResponse.json(newSecret, { status: 201 });
  } catch (error) {
    console.error("Error creating secret:", error);
    return NextResponse.json(
      { error: "Failed to create secret" },
      { status: 500 }
    );
  }
}

// PUT /api/secret - Update a secret
export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      key,
      value,
      description,
      environment_type,
      type,
      permission,
      expiryDate,
      rotationPolicy
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Secret ID is required" },
        { status: 400 }
      );
    }

    // Get existing secret
    const existingSecret = await prisma.secret.findUnique({
      where: { id }
    });

    if (!existingSecret) {
      return NextResponse.json(
        { error: "Secret not found" },
        { status: 404 }
      );
    }

    // Parse existing history and add new version
    const history = existingSecret.history as any[];
    const newVersion = (parseInt(existingSecret.version) + 1).toString();
    
    const updatedSecret = await prisma.secret.update({
      where: { id },
      data: {
        key: key || existingSecret.key,
        value: value || existingSecret.value,
        description: description || existingSecret.description,
        environment_type: environment_type || existingSecret.environment_type,
        version: newVersion,
        type: type || existingSecret.type,
        history: [
          {
            version: newVersion,
            value: value || existingSecret.value,
            description: description || existingSecret.description,
            updatedAt: new Date(),
            updatedBy: auth.user.email
          },
          ...history
        ],
        updatedBy: auth.user.email,
        permission: permission || existingSecret.permission,
        expiryDate: expiryDate ? new Date(expiryDate) : existingSecret.expiryDate,
        rotationPolicy: rotationPolicy || existingSecret.rotationPolicy
      }
    });

    return NextResponse.json(updatedSecret);
  } catch (error) {
    console.error("Error updating secret:", error);
    return NextResponse.json(
      { error: "Failed to update secret" },
      { status: 500 }
    );
  }
}

// DELETE /api/secret - Delete a secret
export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Secret ID is required" },
        { status: 400 }
      );
    }

    await prisma.secret.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "Secret deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting secret:", error);
    return NextResponse.json(
      { error: "Failed to delete secret" },
      { status: 500 }
    );
  }
}