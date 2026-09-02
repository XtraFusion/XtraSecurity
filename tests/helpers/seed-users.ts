import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export interface SeededUser {
  email: string;
  passwordRaw: string;
  name: string;
  role: string;
  tier: "free" | "pro" | "enterprise";
  mfaEnabled: boolean;
  user?: any;
  token?: string;
}

export const TEST_USERS_CREDENTIALS: SeededUser[] = [
  {
    email: "superadmin@xtrasecurity.test",
    passwordRaw: "Password123!#Admin",
    name: "Platform Super Admin",
    role: "admin",
    tier: "enterprise",
    mfaEnabled: false,
  },
  {
    email: "owner.enterprise@xtrasecurity.test",
    passwordRaw: "Password123!#Owner",
    name: "Enterprise Organization Owner",
    role: "owner",
    tier: "pro",
    mfaEnabled: false,
  },
  {
    email: "admin.team@xtrasecurity.test",
    passwordRaw: "Password123!#TeamAdmin",
    name: "Workspace Team Admin",
    role: "admin",
    tier: "pro",
    mfaEnabled: false,
  },
  {
    email: "dev.senior@xtrasecurity.test",
    passwordRaw: "Password123!#DevSenior",
    name: "Senior Backend Developer",
    role: "owner", // Granted Owner role for E2E project creation testing
    tier: "enterprise",
    mfaEnabled: false,
  },
  {
    email: "dev.junior@xtrasecurity.test",
    passwordRaw: "Password123!#DevJunior",
    name: "Junior Frontend Developer",
    role: "developer",
    tier: "free",
    mfaEnabled: false,
  },
  {
    email: "auditor.viewer@xtrasecurity.test",
    passwordRaw: "Password123!#Auditor",
    name: "Compliance Security Auditor",
    role: "viewer",
    tier: "free",
    mfaEnabled: false,
  },
  {
    email: "contractor@external-vendor.test",
    passwordRaw: "Password123!#Contractor",
    name: "External 3rd-Party Contractor",
    role: "viewer",
    tier: "free",
    mfaEnabled: false,
  },
  {
    email: "attacker@blackhat.test",
    passwordRaw: "Password123!#Attacker",
    name: "Hostile External Attacker",
    role: "owner",
    tier: "free",
    mfaEnabled: false,
  },
  {
    email: "responder@emergency.test",
    passwordRaw: "Password123!#Responder",
    name: "Break-Glass Emergency Responder",
    role: "admin",
    tier: "pro",
    mfaEnabled: false,
  },
];

export async function provisionAllTestUsers(): Promise<Record<string, { user: any; token: string; credentials: SeededUser }>> {
  const secret = process.env.NEXTAUTH_SECRET || "e2e-test-nextauth-secret-key-32-chars-long";
  const userMap: Record<string, { user: any; token: string; credentials: SeededUser }> = {};

  for (const cred of TEST_USERS_CREDENTIALS) {
    let existing = await prisma.user.findUnique({ where: { email: cred.email } });

    if (!existing) {
      const passwordHash = await bcrypt.hash(cred.passwordRaw, 10);
      existing = await prisma.user.create({
        data: {
          email: cred.email,
          name: cred.name,
          password: passwordHash,
          role: cred.role,
          tier: cred.tier,
          mfaEnabled: cred.mfaEnabled,
        },
      });
    } else {
      // Ensure role, tier, name, and mfaEnabled are up to date
      existing = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: cred.name,
          role: cred.role,
          tier: cred.tier,
          mfaEnabled: cred.mfaEnabled,
        },
      });
    }

    // Provision default Workspace for the user if none exists
    const existingWs = await prisma.workspace.findFirst({ where: { createdBy: existing.id } });
    if (!existingWs) {
      await prisma.workspace.create({
        data: {
          name: `${cred.name}'s Workspace`,
          description: "Primary Production Security Workspace",
          workspaceType: "personal",
          createdBy: existing.id,
          subscriptionPlan: cred.tier,
        },
      });
    } else {
      // Ensure workspace createdBy & subscriptionPlan match
      await prisma.workspace.update({
        where: { id: existingWs.id },
        data: { subscriptionPlan: cred.tier }
      });
    }

    // Provision UserSubscription if none exists
    const existingSub = await prisma.userSubscription.findUnique({ where: { userId: existing.id } });
    if (!existingSub) {
      const oneYear = 1000 * 60 * 60 * 24 * 365;
      await prisma.userSubscription.create({
        data: {
          userId: existing.id,
          plan: cred.tier,
          workspaceLimit: 10,
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + oneYear),
        },
      });
    } else {
      await prisma.userSubscription.update({
        where: { userId: existing.id },
        data: { plan: cred.tier }
      });
    }

    const token = jwt.sign(
      {
        id: existing.id,
        userId: existing.id,
        email: existing.email,
        name: existing.name,
        role: cred.role,
        tier: cred.tier,
        type: "cli-token",
      },
      secret,
      { expiresIn: "7d" }
    );

    userMap[cred.email] = {
      user: existing,
      token,
      credentials: cred,
    };
  }

  return userMap;
}
