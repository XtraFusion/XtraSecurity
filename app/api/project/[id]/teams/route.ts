
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check permission: Owner or Admin
  // We use dynamic import to avoid circular dependency issues if any, though likely safe with direct import
  const { getUserProjectRole } = await import("@/lib/permissions");
  const role = await getUserProjectRole(auth.userId, params.id);

  if (!role || (role !== 'owner' && role !== 'admin')) {
       return NextResponse.json({ error: "Only project owners and admins can view team assignments" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
        teamProjects: {
            include: {
                team: true
            }
        }
    }
  });

  if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project.teamProjects);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await req.json();

  if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
  }

  const { getUserProjectRole } = await import("@/lib/permissions");
  const role = await getUserProjectRole(auth.userId, params.id);

  if (!role || (role !== 'owner' && role !== 'admin')) {
      return NextResponse.json({ error: "Only project owners and admins can add teams" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
      where: { id: params.id }
  });

  // Check if already assigned
  const existing = await prisma.teamProject.findUnique({
      where: {
          teamId_projectId: {
              teamId,
              projectId: params.id
          }
      }
  });

  if (existing) {
      return NextResponse.json({ error: "Team is already assigned to this project" }, { status: 409 });
  }

  const teamProject = await prisma.teamProject.create({
      data: {
          teamId,
          projectId: params.id
      },
      include: {
          team: true
      }
  });

  return NextResponse.json(teamProject);
}