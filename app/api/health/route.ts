import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const checks: {
    database: { status: "healthy" | "unhealthy"; latencyMs?: number; error?: string };
    encryption: { status: "healthy" | "unhealthy"; latencyMs?: number; error?: string };
    redis: { status: "healthy" | "unhealthy" | "disabled"; latencyMs?: number; error?: string };
  } = {
    database: { status: "unhealthy" },
    encryption: { status: "unhealthy" },
    redis: { status: "disabled" },
  };

  let allHealthy = true;

  // 1. Database Connection Check
  const dbStart = Date.now();
  try {
    // Lightweight count query to assert DB responsiveness
    await prisma.project.findFirst({ select: { id: true } });
    checks.database = {
      status: "healthy",
      latencyMs: Date.now() - dbStart,
    };
  } catch (err: any) {
    allHealthy = false;
    checks.database = {
      status: "unhealthy",
      latencyMs: Date.now() - dbStart,
      error: err.message,
    };
  }

  // 2. Encryption Engine Round-Trip Probe
  const encStart = Date.now();
  try {
    const testSecret = `probe-${Date.now()}`;
    const encrypted = encrypt(testSecret);
    const decrypted = decrypt(encrypted);
    if (decrypted !== testSecret) {
      throw new Error("Decrypted value did not match plaintext probe");
    }
    checks.encryption = {
      status: "healthy",
      latencyMs: Date.now() - encStart,
    };
  } catch (err: any) {
    allHealthy = false;
    checks.encryption = {
      status: "unhealthy",
      latencyMs: Date.now() - encStart,
      error: err.message,
    };
  }

  // 3. Redis Ping Probe (if configured)
  if (redis && process.env.REDIS_URL) {
    const redisStart = Date.now();
    try {
      const pong = await Promise.race([
        redis.ping(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Redis ping timeout after 2000ms")), 2000)),
      ]);
      if (pong === "PONG") {
        checks.redis = {
          status: "healthy",
          latencyMs: Date.now() - redisStart,
        };
      } else {
        checks.redis = {
          status: "unhealthy",
          latencyMs: Date.now() - redisStart,
          error: `Unexpected ping response: ${pong}`,
        };
      }
    } catch (err: any) {
      // Redis absence shouldn't take down the entire API if fallback is active, but flag it
      checks.redis = {
        status: "unhealthy",
        latencyMs: Date.now() - redisStart,
        error: err.message,
      };
    }
  }

  const totalDurationMs = Date.now() - startTime;
  const status = allHealthy ? "ok" : "degraded";
  const statusCode = allHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      durationMs: totalDurationMs,
      checks,
      system: {
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    },
    { status: statusCode }
  );
}
