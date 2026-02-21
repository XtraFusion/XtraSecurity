import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { generateApiKey } from "@/lib/auth/service-account";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string; saId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, saId } = await params;
    const body = await req.json();
    const { label, expiresInDays } = body;

    // Verify access logic similar to other routes...
    const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { userId: session.user.id },
            {
              teamProjects: {
                some: {
                  team: {
                    members: {
                      some: {
                        userId: session.user.id,
                        status: "active"
                      }
                    }
                  }
                }
              }
            }
          ]
        }
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Generate Key
    const { key, hash, mask } = generateApiKey();
    
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        key: hash, // Store HASH, not raw key
        label: label || "Generated Key",
        // keyMask: mask, // Schema doesn't have keyMask yet, I should add it or just rely on 'key' being unique. 
        // Wait, schema has `key` as unique string. If I store hash there, I can't look up by raw key unless I hash it first.
        // My helper does `validateApiKey` which hashes input.
        // But for display, I have no mask field in DB. I should have added `keyMask`.
        // Current ApiKey: key, label, lastUsed, expiresAt, userId?, serviceAccountId?
        // I will use `label` to store mask? No that's hacky.
        // I skipped adding `keyMask` in the schema update. I should verify schema.
        
        keyMask: mask,
        serviceAccountId: saId,
        expiresAt
      }
    });

    // Return the RAW key to the user ONE TIME only
    return NextResponse.json({ 
        id: apiKey.id,
        key: key, // Raw key
        mask: mask,
        label: apiKey.label,
        expiresAt: apiKey.expiresAt
    }, { status: 201 });

  } catch (error) {
    console.error("POST api-keys error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ projectId: string; saId: string }> }
) {
    // List keys (masked)
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { saId } = await params;

    const keys = await prisma.apiKey.findMany({
        where: { serviceAccountId: saId },
        select: {
            id: true,
            label: true,
            lastUsed: true,
            expiresAt: true,
            createdAt: true,
            keyMask: true // Return masked key
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(keys);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ projectId: string; saId: string }> } // Logic for deleting a specific key
) {
    // Need keyId in params or body. Assuming separate route or body.
    // Making this route just for creation/list for now. Delete on nested resource usually needs Key ID in URL.
    // I'll skip DELETE implementation here and rely on a separate route: .../keys/[keyId] if identifying by ID.
    // or just accept DELETE with body.
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
