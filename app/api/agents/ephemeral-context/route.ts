import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";
import { generateApiKey } from "@/lib/auth/service-account";

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, agentName, scopes, durationMinutes } = body;

    if (!projectId || !agentName || !scopes || !durationMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (durationMinutes > 60 || durationMinutes <= 0) {
      return NextResponse.json({ error: "Duration must be between 1 and 60 minutes for security reasons" }, { status: 400 });
    }

    // Verify user has access to project
    // In production, use robust permission resolver here. For demonstration, we check ownership.
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true, workspaceId: true }
    });

    if (!project || project.userId !== auth.userId) { 
       // Fallback check team access if needed (skipping for simplicity here)
       return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
    }

    // 1. Generate ephemeral API Key
    const { key, hash, mask } = generateApiKey();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    // 2. Create the strict Agent Context (Service Account) with attached key
    const agentServiceAccount = await prisma.serviceAccount.create({
      data: {
        name: `Agent: ${agentName}`,
        description: `Ephemeral context dynamically generated for AI Agent execution.`,
        projectId,
        permissions: scopes, // e.g. ["read:secret", "read:branch"]
        isAgent: true,
        createdBy: auth.userId,
        apiKeys: {
          create: {
            key: hash,
            keyMask: mask,
            label: `Ephemeral Token (${durationMinutes}m TTL)`,
            expiresAt,
            userId: auth.userId,
            workspaceId: project.workspaceId
          }
        }
      },
      include: {
        apiKeys: true
      }
    });

    // 3. Return the plaintext token (ONLY shown once)
    return NextResponse.json({
      message: "Ephemeral Agent Context generated successfully",
      agentToken: key,
      expiresAt,
      scopes: agentServiceAccount.permissions,
      serviceAccountId: agentServiceAccount.id
    }, { status: 201 });

  } catch (error: any) {
    console.error("[api/agents/ephemeral-context]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
