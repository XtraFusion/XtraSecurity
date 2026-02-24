import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { encrypt } from "@/lib/encription";
import { withSecurity } from "@/lib/api-middleware";
import { getUserProjectRole } from "@/lib/permissions";

// POST /api/secret/bulk - Bulk create secrets
export const POST = withSecurity(async (request, context, session) => {
  try {
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { secrets, projectId, branchId } = body;

    if (!projectId || !secrets || !Array.isArray(secrets) || secrets.length === 0) {
      return NextResponse.json(
        { message: "Missing required fields: projectId or secrets array" },
        { status: 400 }
      );
    }

    // Rate Limiting & User Plan Constraints
    const projectRecord = await prisma.project.findUnique({
      where: { id: projectId },
      include: { user: true }
    });

    if (!projectRecord || !projectRecord.user) {
        return NextResponse.json({ error: "Project or owner not found" }, { status: 404 });
    }

    const ownerTier = (projectRecord.user.tier || "free") as import("@/lib/rate-limit-config").Tier;
    const maxSecretsPerProject = import("@/lib/rate-limit-config").then(mod => mod.DAILY_LIMITS[ownerTier].maxSecretsPerProject);
    const resolvedMaxSecrets = await maxSecretsPerProject;

    const secretCount = await prisma.secret.count({
      where: { projectId: projectId }
    });

    if (secretCount + secrets.length > resolvedMaxSecrets) {
      return NextResponse.json({ 
        error: "Secret limit reached", 
        message: `The workspace owner's ${ownerTier} plan allows up to ${resolvedMaxSecrets} secrets per project. You are trying to add ${secrets.length} secrets, but only ${resolvedMaxSecrets - secretCount} slots remain.` 
      }, { status: 403 });
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

        if (role === "viewer") {
             return NextResponse.json({ error: "Viewers do not have permission to create secrets" }, { status: 403 });
        }
        
        if (role === "developer" && secrets.some(s => s.environmentType === "production")) {
             return NextResponse.json({ error: "Developers cannot create secrets in Production" }, { status: 403 });
        }
    }

    // Process and create secrets sequentially/in-parallel up to reasonable limit
    const createdSecrets = [];

    // Use Promise.all with map for efficiency, assuming < 200 secrets.
    const createPromises = secrets.map(async (secretInput: any) => {
        const encryptedValue = encrypt(secretInput.value);
        const encryptedString = JSON.stringify(encryptedValue);

        const newSecret = await prisma.secret.create({
            data: {
              key: secretInput.key,
              value: [encryptedString],
              description: secretInput.description || "Imported from .env file",
              environmentType: secretInput.environmentType || "development",
              version: "1",
              projectId,
              branchId: branchId || null,
              rotationPolicy: secretInput.rotationPolicy || "manual",
              type: secretInput.type || "API Key",
              history: [
                {
                  version: "1",
                  value: secretInput.value,
                  description: secretInput.description || "Imported from .env file",
                  updatedAt: new Date().toISOString(),
                  updatedBy: session.email!,
                },
              ],
              updatedBy: session.email!,
              permission: secretInput.permission || [],
              expiryDate: secretInput.expiryDate ? new Date(secretInput.expiryDate) : null,
            },
        });

        return {
            ...newSecret,
            value: secretInput.value, // Return plain text value for the UI immediately
        };
    });

    const results = await Promise.all(createPromises);

    return NextResponse.json({ success: true, count: results.length, secrets: results }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bulk secrets:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create bulk secrets" },
      { status: 500 }
    );
  }
});
