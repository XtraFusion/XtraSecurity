import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { getUserTeamRole, canManageMembers } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    const { member } = await req.json();
    const { teamId, email, role } = member;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // generate a simple token for accept link (short-lived token could be implemented later)
    const inviteToken = Math.random().toString(36).slice(2, 12);

    // Check inviter permissions
    const inviterRole = await getUserTeamRole(session.user.id, teamId);
    if (!canManageMembers(inviterRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invite = await prisma.teamUser.create({
      data: {
        teamId,
        userId: user.id,
        role,
        status: "pending",
        invitedBy: session.user.id,
      },
    });

    // create notification with invite link/token
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          userEmail: user.email || "",
          taskTitle: "Team Access Granted",
          description: `You have been added to team ${teamId}`,
          message: `You are now a member of the team.`,
          status: "unread",
          read: false,
        },
      });
      await dispatchNotification({
        title: "New Team Invite",
        message: `${user.email} was invited to a team`,
        type: "info",
        fields: [{ label: "Role", value: role }],
      });
    } catch (notifErr) {
      console.error("Failed to create notification for invite:", notifErr);
    }

    return NextResponse.json(
      { message: "Invitation sent", invite, inviteToken },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /team/invite error:", error);

    // Handle known Prisma errors (optional)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User already invited to this team" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}


export async function  GET(){

  const session = await getServerSession(authOptions);
  if(!session?.user.id){
    return NextResponse.json({error:"Unauthorized"},{status:401});
  }

  const invites = await prisma.teamUser.findMany({
    where:{userId:session.user.id,status:"pending"},
    include:{
      team:true,
      user:true
    }
  });

  return NextResponse.json({invites},{status:200});
}