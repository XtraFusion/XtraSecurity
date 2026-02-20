import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { compare } from "bcryptjs";
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
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return ambiguous generic error to prevent email enumeration
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Special logic for "admin@example.com" if no password exists for testing.
    // In production, we'd remove this.
    if (user.email === "admin@example.com" && password === "password" && !user.password) {
      // Continue to OTP generation
    } 
    // Otherwise, standard password check
    else if (!user.password) {
       // Setup account if password not set? For now, just fail.
       return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }
    else {
      // 2. Verify password
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 }
        );
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
      { message: "OTP sent to your email", requireOtp: true },
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
