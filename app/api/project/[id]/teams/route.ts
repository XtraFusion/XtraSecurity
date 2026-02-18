
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

  // TODO: Add proper permission check (Project Owner or Admin)
  // For now, checks if user has access to project
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
  
  // Basic check: User must be owner or part of a team on this project?
  // or just if they can see the project.
  // For settings, strictly enforcing owner or team admin is better.
  if (project.userId !== auth.userId) {
       // Allow if user is part of the project via another team?? 
       // For simplicity in this phase, only Owner can manage teams.
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const project = await prisma.project.findUnique({
      where: { id: params.id }
  });

  if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden: Only project owner can add teams" }, { status: 403 });
  }

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