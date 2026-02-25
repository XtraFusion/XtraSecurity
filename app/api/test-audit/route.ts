import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createTamperEvidentLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    const project = await prisma.project.findFirst();
    
    if (!user || !project) {
        return NextResponse.json({ error: "No user or project" }, { status: 400 });
    }

    const log = await createTamperEvidentLog({
      userId: user.id,
      action: "secret.create",
      entity: "secret",
      entityId: "test-secret-id",
      workspaceId: project.workspaceId,
      changes: { key: "test", environment: "test", branch: "test" }
    });

    return NextResponse.json({ success: true, log });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}
