import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust path if needed
import { verifyAuth } from "@/lib/auth"; // Adjust path if needed

// POST /api/projects/:projectId/envs/:env/secrets/link
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; env: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, sourceProjectId, sourceEnv, sourceKey } = await req.json();

    if (!key || !sourceProjectId || !sourceEnv || !sourceKey) {
      return NextResponse.json(
        { error: "Missing required fields: key, sourceProjectId, sourceEnv, sourceKey" },
        { status: 400 }
      );
    }

    // 1. Find the Source Secret
    // We need to find the projectId first? The user might pass project ID or Name.
    // Assuming sourceProjectId is an ID for simplicity, or we resolve it.
    // Let's assume ID.
    
    // Find source project to verify it exists
    const sourceProject = await prisma.project.findUnique({
        where: { id: sourceProjectId }
    });

    if (!sourceProject) {
        return NextResponse.json({ error: "Source project not found" }, { status: 404 });
    }

    const sourceSecret = await prisma.secret.findFirst({
      where: {
        projectId: sourceProjectId,
        environmentType: sourceEnv,
        key: sourceKey,
      },
    });

    if (!sourceSecret) {
      return NextResponse.json(
        { error: `Source secret '${sourceKey}' not found in project ${sourceProjectId} (${sourceEnv})` },
        { status: 404 }
      );
    }

    // 2. Prevent Circular References (Simple check: Source cannot be a reference itself for now, or check ID)
    if (sourceSecret.isReference) {
         // Deep Linking: If source is Reference, point to ITS source? Or disallow?
         // For V1, let's point to the ultimate source (Optimization) or just link check.
         // Let's disallow linking to a reference for simplicity to prevent cycles.
         return NextResponse.json({ error: "Cannot link to a secret that is already a reference" }, { status: 400 });
    }

    // 3. Create the Linked Secret
    const newSecret = await prisma.secret.create({
      data: {
        key,
        value: [], // Empty value for reference
        description: `Linked to ${sourceProject.name}:${sourceEnv}:${sourceKey}`,
        projectId: params.projectId,
        environmentType: params.env,
        version: "1",
        type: "reference",
        isReference: true,
        sourceSecretId: sourceSecret.id,
        history: [],
        updatedBy: auth.userId,
        rotationPolicy: "manual"
      },
    });

    return NextResponse.json(newSecret, { status: 201 });
  } catch (error: any) {
    console.error("Link secret error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
