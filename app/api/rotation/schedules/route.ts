import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/rotation/schedules
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    // Fetch schedules
    // In a real app, we'd filter by user permissions (e.g., project member)
    const schedules = await prisma.rotationSchedule.findMany({
      where: projectId ? { projectId } : {},
      include: {
        secret: {
          select: {
            id: true,
            key: true,
            branch: { select: { name: true } },
            project: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedSchedules = schedules.map(s => ({
      id: s.id,
      secretId: s.secretId,
      secretKey: s.secret.key,
      projectId: s.projectId,
      projectName: s.secret.project.name,
      branch: s.secret.branch?.name || "Global",
      frequency: s.frequency,
      customDays: s.customDays,
      enabled: s.status === "active",
      nextRotation: s.nextRotation?.toISOString(),
      lastRotation: s.lastRotation?.toISOString(),
      rotationMethod: s.method,
      webhookUrl: s.webhookUrl,
      createdAt: s.createdAt?.toISOString(),
    }));

    return NextResponse.json(formattedSchedules);
  } catch (error: any) {
    console.error("GET /rotation/schedules error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// POST /api/rotation/schedules
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      secretKey, 
      projectId, 
      branch: branchName, 
      frequency, 
      customDays, 
      rotationMethod, 
      webhookUrl 
    } = body;

    // Resolve Secret ID (We assume the user knows the Key + Project + Branch)
    // This is a bit tricky because the UI asks for Key, but we need the specific Secret ID.
    // Ideally, the UI selects from existing secrets. But sticking to the UI provided:
    
    // Find ID of the branch if name provided
    let branchId = null;
    if (branchName) {
        const branch = await prisma.branch.findFirst({
            where: { projectId, name: branchName }
        });
        branchId = branch?.id;
    }

    // Find the secret
    const secret = await prisma.secret.findFirst({
        where: {
            projectId,
            key: secretKey,
            branchId: branchId || undefined // Use undefined if null to match optional
        }
    });

    if (!secret) {
        return NextResponse.json({ error: `Secret ${secretKey} not found in this project/branch` }, { status: 404 });
    }

    // Check if schedule already exists
    const existing = await prisma.rotationSchedule.findUnique({
        where: { secretId: secret.id }
    });

    if (existing) {
        return NextResponse.json({ error: "Rotation schedule already exists for this secret" }, { status: 409 });
    }

    // Create Schedule
    const nextRotation = new Date();
    nextRotation.setDate(nextRotation.getDate() + 30); // Default start

    const schedule = await prisma.rotationSchedule.create({
      data: {
        secretId: secret.id,
        projectId,
        environment: secret.environmentType,
        frequency,
        customDays,
        nextRotation,
        method: rotationMethod,
        webhookUrl,
        status: "active"
      }
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    console.error("POST /rotation/schedules error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
