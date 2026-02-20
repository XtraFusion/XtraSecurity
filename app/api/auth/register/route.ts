import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
        emailVerified: new Date(),
        role: "user",
      },
    });

    // Create personal workspace + free subscription
    try {
      const workspaceName = user.name ? `${user.name}'s workspace` : "Personal Workspace";
      await prisma.workspace.create({
        data: {
          name: workspaceName,
          description: "Personal workspace",
          workspaceType: "personal",
          createdBy: user.id,
          subscriptionPlan: "free",
        },
      });

      const oneYear = 1000 * 60 * 60 * 24 * 365;
      await prisma.userSubscription.create({
        data: {
          userId: user.id,
          plan: "free",
          workspaceLimit: 3,
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + oneYear),
        },
      });
    } catch (e) {
      console.error("[auth] Failed to create workspace for new user:", e);
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
