import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Helper function to check authentication

// GET /api/secret - Get all secrets or filter by projectId
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const query = branchId ? { branchId } : {};
    const secrets = await prisma.secret.findMany({
      where: query,
      include: {
        project: true,
      },
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log(body,"data");
    const {
      key,
      value,
      description,
      environmentType,
      projectId,
      type,
      branchId,
      permission = [],
      expiryDate,
      rotationPolicy = "manual",
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
        environmentType,
        version: "1",
        projectId,
        branchId,
        type,
        history: [
          {
            version: "1",
            value,
            description,
            updatedAt: new Date(),
            updatedBy: session.user.id,
          },
        ],
        updatedBy: session.user.id,
        permission,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        rotationPolicy,
      },
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      key,
      value,
      description,
      projectId,
      branchId,
      environment_type,
      type,
      permission,
      expiryDate,
      rotationPolicy,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Secret ID is required" },
        { status: 400 }
      );
    }

    // Get existing secret
    const existingSecret = await prisma.secret.findUnique({
      where: { id },
    });

    if (!existingSecret) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 });
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
        environmentType: environment_type || existingSecret.environmentType,
        version: newVersion,
        type: type || existingSecret.type,
        history: [
          {
            version: newVersion,
            value: value || existingSecret.value,
            description: description || existingSecret.description,
            updatedAt: new Date(),
            updatedBy: session.user.email,
          },
          ...history,
        ],
        updatedBy: session.user.email,
        permission: permission || existingSecret.permission,
        expiryDate: expiryDate
          ? new Date(expiryDate)
          : existingSecret.expiryDate,
        rotationPolicy: rotationPolicy || existingSecret.rotationPolicy,
      },
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
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
      where: { id },
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
