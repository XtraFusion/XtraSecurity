import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * Get client IP from request
 */
export function getClientIp(req: NextRequest): string {
  // Check various headers for real IP (behind proxy/load balancer)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback (may not work in all environments)
  return "127.0.0.1";
}

/**
 * Check if IP is allowed for a user
 */
export async function isIpAllowedForUser(
  userId: string,
  clientIp: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ipAllowlist: true },
  });

  // If no allowlist configured, allow all IPs
  if (!user || !user.ipAllowlist || user.ipAllowlist.length === 0) {
    return true;
  }

  return isIpInList(clientIp, user.ipAllowlist);
}

/**
 * Check if IP is allowed for a project
 */
export async function isIpAllowedForProject(
  projectId: string,
  clientIp: string
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ipRestrictions: true },
  });

  // If no restrictions configured, allow all IPs
  if (!project || !project.ipRestrictions || project.ipRestrictions.length === 0) {
    return true;
  }

  // Extract IP addresses from restriction objects
  const allowedIps = project.ipRestrictions
    .map((r: any) => r.ip)
    .filter(Boolean);

  if (allowedIps.length === 0) {
    return true;
  }

  return isIpInList(clientIp, allowedIps);
}

/**
 * Check if IP matches any in the list (supports CIDR notation)
 */
function isIpInList(clientIp: string, allowedIps: string[]): boolean {
  for (const allowed of allowedIps) {
    if (allowed === clientIp) {
      return true;
    }

    // Support CIDR notation (e.g., 192.168.1.0/24)
    if (allowed.includes("/")) {
      if (isIpInCidr(clientIp, allowed)) {
        return true;
      }
    }

    // Support wildcards (e.g., 192.168.1.*)
    if (allowed.includes("*")) {
      const regex = new RegExp("^" + allowed.replace(/\*/g, "\\d+") + "$");
      if (regex.test(clientIp)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if IP is within CIDR range
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = parseInt(bits);

  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  const maskNum = ~(2 ** (32 - mask) - 1);

  return (ipNum & maskNum) === (rangeNum & maskNum);
}

/**
 * Convert IP string to number
 */
function ipToNumber(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
}

/**
 * Create IP check response if blocked
 */
export function createIpBlockedResponse(clientIp: string): NextResponse {
  return NextResponse.json(
    {
      error: "Access denied",
      message: `IP address ${clientIp} is not in the allowlist`,
      code: "IP_NOT_ALLOWED",
    },
    { status: 403 }
  );
}
