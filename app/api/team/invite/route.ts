import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { getUserTeamRole, canManageMembers } from "@/lib/permissions";
import { sendEmail } from "@/lib/email";

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

    const team = await prisma.team.findUnique({ where: { id: teamId } });

    const invite = await prisma.teamUser.create({
      data: {
        teamId,
        userId: user.id,
        role,
        status: "pending",
        invitedBy: session.user.id,
      },
    });

    // Send email with invite link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const acceptLink = `${appUrl}/invites`; // Link to the user's pending invites dashboard

    await sendEmail({
      to: user.email || "",
      subject: `[XtraSecurity] Invitation to join ${team?.name || 'a team'}`,
      text: `You have been invited to join ${team?.name || 'a team'} as a ${role}.\n\nAccept your invite here: ${acceptLink}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #4f46e5;">XtraSecurity Team Invitation</h2>
          <p>Hi there,</p>
          <p>You have been invited by <strong>${session.user.name || session.user.email}</strong> to join the team <strong>${team?.name || 'XtraSecurity'}</strong> with the role of <strong>${role}</strong>.</p>
          <div style="margin: 30px 0;">
            <a href="${acceptLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Invites Dashboard</a>
          </div>
          <p style="color: #4b5563;">Or copy and paste this link into your browser:</p>
          <p style="color: #6b7280; font-size: 14px;">${acceptLink}</p>
        </div>
      `
    });

    // create system notification
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          userEmail: user.email || "",
          taskTitle: "Team Invitation",
          description: `You have been added to team ${team?.name || teamId}`,
          message: `You are now invited to join as a ${role}.`,
          status: "info",
          read: false,
        },
      });
      await dispatchNotification({
        title: "New Team Invite Sent",
        message: `${user.email} was invited to a team`,
        type: "info",
        fields: [{ label: "Role", value: role }],
      });
    } catch (notifErr) {
      console.error("Failed to create system notification for invite:", notifErr);
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