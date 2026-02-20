import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";

export async function DELETE(
    req: Request,
    { params }: { params: { projectId: string; saId: string; keyId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { projectId, saId, keyId } = params;

        // Verify project access check
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
                                            status: "active",
                                            role: { in: ["owner", "admin"] } // Only admins/owners can revoke keys
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
            return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
        }

        // Delete the Key
        await prisma.apiKey.delete({
            where: {
                id: keyId,
                serviceAccountId: saId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE key error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
