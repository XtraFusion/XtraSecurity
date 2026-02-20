import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encription";
import { withSecurity } from "@/lib/api-middleware";
import { getUserProjectRole } from "@/lib/permissions";

// GET /api/secret - Get all secrets for a project
export const GET = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const branchId = searchParams.get("branchId");

    if (!projectId) {
         return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Access Control
    let isViewer = false;
    if (session.isServiceAccount) {
        if (session.projectId !== projectId) return NextResponse.json({ error: "Forbidden: SA locked to project" }, { status: 403 });
        if (!session.permissions?.includes("read:secrets")) return NextResponse.json({ error: "Forbidden: Missing read:secrets scope" }, { status: 403 });
    } else {
        const role = await getUserProjectRole(session.userId, projectId);
        if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        if (role === 'viewer') isViewer = true;
    }

    const query: any = { projectId };
    if (branchId) query.branchId = branchId;

    const secrets = await prisma.secret.findMany({
      where: query,
      include: {
        project: true,
      },
    });

    // Decrypt secret values and history before sending to frontend
    const decryptedSecrets = secrets.map((secret) => {
      // If Viewer, REDACT content
      if (isViewer) {
          return {
              ...secret,
              value: "[REDACTED]",
              history: [] // Hide history too
          };
      }

      let decryptedValue = "[Decryption failed]";
      try {
        const encryptedString = secret.value[0];
        const encryptedObject = JSON.parse(encryptedString);
        decryptedValue = decrypt(encryptedObject);
      } catch (error) {
        console.error(`Failed to decrypt secret ${secret.id}:`, error);
      }

      // Decrypt history if present
      let decryptedHistory = secret.history;
      if (Array.isArray(secret.history)) {
        decryptedHistory = secret.history.map((h: any) => {
          try {
            let val = h.value;
            if (Array.isArray(val) && val.length > 0) {
              val = val[0];
            }

            if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
              try {
                const parsed = JSON.parse(val);
                if (parsed.iv && parsed.encryptedData && parsed.authTag) {
                  val = decrypt(parsed);
                } else if (Array.isArray(parsed) && parsed.length > 0) {
                  const inner = JSON.parse(parsed[0]);
                  if (inner && inner.iv && inner.encryptedData && inner.authTag) {
                    val = decrypt(inner);
                  }
                }
              } catch (e) {}
            }
            return { ...h, value: val };
          } catch (e) {
            return h;
          }
        });
      }

      return {
        ...secret,
        value: decryptedValue,
        history: decryptedHistory
      };
    });

    return NextResponse.json(decryptedSecrets);
  } catch (error) {
    console.error("Error fetching secrets:", error);
    return NextResponse.json(
      { error: "Failed to fetch secrets" },
      { status: 500 }
    );
  }
});

// POST /api/secret - Create a new secret
export const POST = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
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

    // Access Control
    if (session.isServiceAccount) {
        if (session.projectId !== projectId) return NextResponse.json({ error: "Forbidden: SA locked to project" }, { status: 403 });
        if (!session.permissions?.includes("write:secrets")) return NextResponse.json({ error: "Forbidden: Missing write:secrets scope" }, { status: 403 });
    } else {
        const role = await getUserProjectRole(session.userId, projectId);
        
        if (!role) {
             return NextResponse.json({ error: "Forbidden: You do not have access to this project" }, { status: 403 });
        }

        // ACL Check: Write
        if (role === "viewer") {
             return NextResponse.json({ error: "Viewers do not have permission to create secrets" }, { status: 403 });
        }
        
        if (role === "developer" && environmentType === "production") {
             return NextResponse.json({ error: "Developers cannot create secrets in Production" }, { status: 403 });
        }
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
            updatedBy: session.email,
          },
        ],
        updatedBy: session.email,
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
});

// PUT /api/secret - Update a secret
export const PUT = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
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

    // Get existing secret to verify project access
    const existingSecret = await prisma.secret.findUnique({
      where: { id },
    });

    if (!existingSecret) {
      return NextResponse.json({ message: "Secret not found" }, { status: 404 });
    }

    const projectId = existingSecret.projectId;

    // Access Control
    if (session.isServiceAccount) {
        if (session.projectId !== projectId) return NextResponse.json({ error: "Forbidden: SA locked to project" }, { status: 403 });
        if (!session.permissions?.includes("write:secrets")) return NextResponse.json({ error: "Forbidden: Missing write:secrets scope" }, { status: 403 });
    } else {
        const role = await getUserProjectRole(session.userId, projectId);
        
        if (!role) {
             return NextResponse.json({ error: "Forbidden: You do not have access to this project" }, { status: 403 });
        }
        
        // ACL Check: Write/Update
        if (role === "viewer") {
             return NextResponse.json({ error: "Viewers do not have permission to update secrets" }, { status: 403 });
        }

        if (role === "developer" && existingSecret.environmentType === "production") {
             return NextResponse.json({ error: "Developers cannot update secrets in Production" }, { status: 403 });
        }
    }

    // Parse existing history and add new version
    const history = existingSecret.history as any[];
    const newVersion = (parseInt(existingSecret.version) + 1).toString();

    // Prepare update data
    const updateData: any = {
      version: newVersion,
      updatedBy: session.email,
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
        updatedBy: session.email,
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
});

// DELETE /api/secret - Delete a secret
export const DELETE = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
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

    const projectId = existingSecret.projectId;

    // Access Control
    if (session.isServiceAccount) {
        if (session.projectId !== projectId) return NextResponse.json({ error: "Forbidden: SA locked to project" }, { status: 403 });
        if (!session.permissions?.includes("write:secrets")) return NextResponse.json({ error: "Forbidden: Missing write:secrets scope" }, { status: 403 });
    } else {
        const role = await getUserProjectRole(session.userId, projectId);
        
        if (!role) {
             return NextResponse.json({ error: "Forbidden: You do not have access to this project" }, { status: 403 });
        }
        
        // ACL Check: Delete
        if (role === "viewer") {
             return NextResponse.json({ error: "Viewers do not have permission to delete secrets" }, { status: 403 });
        }
        
        if (role === "developer") {
             // Developers cannot delete in Production
             if (existingSecret.environmentType === "production") {
                  return NextResponse.json({ error: "Developers cannot delete secrets in Production" }, { status: 403 });
             }
        }
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
});
