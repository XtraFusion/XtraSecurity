import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { encrypt, decrypt } from "@/lib/encription";

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

    // Decrypt secret values before sending to frontend
    const decryptedSecrets = secrets.map((secret) => {
      try {
        // Value is stored as array of JSON strings
        const encryptedString = secret.value[0];
        const encryptedObject = JSON.parse(encryptedString);
        const decryptedValue = decrypt(encryptedObject);
        
        return {
          ...secret,
          value: decryptedValue, // Return plain text value
        };
      } catch (error) {
        console.error(`Failed to decrypt secret ${secret.id}:`, error);
        // Return the secret with masked value if decryption fails
        return {
          ...secret,
          value: "[Decryption failed]",
        };
      }
    });

    return NextResponse.json(decryptedSecrets);
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
    console.log("Creating secret with data:", body);
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
      rotationType = "automatic",
    } = body;

    // Validate required fields
    if (!key || !value || !projectId) {
      return NextResponse.json(
        { message: "Missing required fields: key, value, or projectId" },
        { status: 400 }
      );
    }

    // Encrypt and prepare value as array
    const encryptedValue = encrypt(value);
    const encryptedString = JSON.stringify(encryptedValue);

    // Create new secret with version history
    const newSecret = await prisma.secret.create({
      data: {
        key,
        value: [encryptedString], // Store encrypted object as JSON string in array
        description: description || "",
        environmentType,
        version: "1",
        projectId,
        branchId: branchId || null,
        rotationPolicy,
        type: type || "API Key",
        history: [
          {
            version: "1",
            value: value,
            description: description || "",
            updatedAt: new Date().toISOString(),
            updatedBy: session.user.email,
          },
        ],
        updatedBy: session.user.email,
        permission,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    // Return the secret with decrypted value for frontend display
    return NextResponse.json(
      {
        ...newSecret,
        value: value, // Return plain text value, not encrypted array
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating secret:", error);
    console.error("Error details:", error.message);
    return NextResponse.json(
      { message: error.message || "Failed to create secret" },
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Secret ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Updating secret with data:", body);
    const {
      key,
      value,
      description,
      environmentType,
      type,
      permission,
      expiryDate,
      rotationPolicy,
    } = body;

    // Get existing secret
    const existingSecret = await prisma.secret.findUnique({
      where: { id },
    });

    if (!existingSecret) {
      return NextResponse.json({ message: "Secret not found" }, { status: 404 });
    }

    // Parse existing history and add new version
    const history = existingSecret.history as any[];
    const newVersion = (parseInt(existingSecret.version) + 1).toString();

    // Prepare update data
    const updateData: any = {
      version: newVersion,
      updatedBy: session.user.email,
    };

    // Only update fields that are provided
    if (key) updateData.key = key;
    if (description !== undefined) updateData.description = description;
    if (environmentType) updateData.environmentType = environmentType;
    if (type) updateData.type = type;
    if (permission) updateData.permission = permission;
    if (rotationPolicy) updateData.rotationPolicy = rotationPolicy;
    if (expiryDate) updateData.expiryDate = new Date(expiryDate);

    // Handle value encryption if provided
    if (value) {
      const encryptedValue = encrypt(value);
      const encryptedString = JSON.stringify(encryptedValue);
      updateData.value = [encryptedString];
    }

    // Update history
    updateData.history = [
      {
        version: newVersion,
        value: value || "[unchanged]",
        description: description || existingSecret.description,
        updatedAt: new Date().toISOString(),
        updatedBy: session.user.email,
        changeReason: body.changeReason,
      },
      ...history,
    ];

    const updatedSecret = await prisma.secret.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedSecret);
  } catch (error: any) {
    console.error("Error updating secret:", error);
    console.error("Error details:", error.message);
    return NextResponse.json(
      { message: error.message || "Failed to update secret" },
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
        { message: "Secret ID is required" },
        { status: 400 }
      );
    }

    // Check if secret exists
    const existingSecret = await prisma.secret.findUnique({
      where: { id },
    });

    if (!existingSecret) {
      return NextResponse.json(
        { message: "Secret not found" },
        { status: 404 }
      );
    }

    await prisma.secret.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Secret deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting secret:", error);
    console.error("Error details:", error.message);
    return NextResponse.json(
      { message: error.message || "Failed to delete secret" },
      { status: 500 }
    );
  }
}
