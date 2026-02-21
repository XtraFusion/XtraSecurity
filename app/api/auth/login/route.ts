import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { compare, hash } from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Find user by email
    let user = await prisma.user.findUnique({
      where: { email },
    });
    
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Auto-register the user if they don't exist
      const hashedPassword = await hash(password, 12);
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
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
    } else {
      // 2. User exists, verify password
      // Special logic for "admin@example.com" if no password exists for testing.
      // In production, we'd remove this.
      if (user.email === "admin@example.com" && password === "password" && !user.password) {
        // Continue to OTP generation
      } 
      // Otherwise, standard password check
      else if (!user.password) {
         return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 }
        );
      }
      else {
        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
          return NextResponse.json(
            { message: "Invalid email or password" },
            { status: 401 }
          );
        }
      }
    }

    // 3. Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // OTP expires in 10 minutes
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

    // 4. Save OTP to user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp: otp,
        emailOtpExpiry: otpExpiry
      }
    });

    // 5. Send OTP via email (mocking for now, or using a basic console log if no mailer configured)
    // TODO: Implement actual email sending logic here e.g. Resend, Nodemailer
    console.log(`[AUTH] OTP for ${user.email} is: ${otp}`);

    return NextResponse.json(
      { message: "OTP sent to your email", requireOtp: true, isNewUser },
      { status: 200 }
    );

  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
