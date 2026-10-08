import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { compare, hash } from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Strict rate limit for web login: 5 attempts per 15 minutes
    const rateLimitResult = await rateLimit(ip, 'web_login', 5, 900);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Too many login attempts. Please try again in 15 minutes.' },
        { 
          status: 429, 
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      );
    }

    const body = await req.json();
    
    // Zod Validation
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { email, password } = parsed.data;

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
      if (!user.password) {
         return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 }
        );
      }
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 }
        );
      }
    }

    // 3. Check if MFA is required
    const requireOtp = user.mfaEnabled || isNewUser;

    if (!requireOtp) {
      return NextResponse.json(
        { message: "Login successful", requireOtp: false },
        { status: 200 }
      );
    }

    // 4. Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // OTP expires in 10 minutes
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

    // 5. Save OTP to user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp: otp,
        emailOtpExpiry: otpExpiry
      }
    });

    // 6. Send OTP via email
    await sendEmail({
      to: user.email!,
      subject: "🔒 Your XtraSecurity Login Code",
      text: `Your login code is: ${otp}\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-w-md; margin: 0 auto; padding: 20px;">
          <h2>Login Verification</h2>
          <p>Your one-time passcode is:</p>
          <h1 style="color: #0ea5e9; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
          <p>This code will expire in 10 minutes. Do not share this with anyone.</p>
        </div>
      `,
    });
    console.log(`[AUTH] Dispatched OTP email to ${user.email}`);

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
