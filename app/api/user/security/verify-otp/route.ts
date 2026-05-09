import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { otp, mfaEnabled } = await req.json();

    if (!otp) {
      return NextResponse.json({ message: "OTP is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user.emailOtp || !user.emailOtpExpiry) {
      return NextResponse.json({ message: "No OTP request found" }, { status: 400 });
    }

    if (user.emailOtp !== otp) {
      return NextResponse.json({ message: "Invalid verification code" }, { status: 400 });
    }

    if (new Date() > user.emailOtpExpiry) {
      return NextResponse.json({ message: "Verification code has expired" }, { status: 400 });
    }

    // OTP is valid! Update MFA settings and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: mfaEnabled,
        emailOtp: null,
        emailOtpExpiry: null
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Two-factor authentication has been ${mfaEnabled ? 'enabled' : 'disabled'}.` 
    });

  } catch (error) {
    console.error("Verify OTP API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
