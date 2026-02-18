import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, AuthSession } from "@/lib/server-auth";
import { checkRateLimit, Tier } from "@/lib/rate-limit";
import { logSecurityEvent, SecurityEventLog } from "@/lib/security-logger";

export type SecureHandler = (
    req: NextRequest, 
    context: any, 
    session: AuthSession | null
) => Promise<NextResponse>;

export function withSecurity(handler: SecureHandler) {
    return async (req: NextRequest, context: any) => {
        const start = Date.now();
        const ip = (req.headers.get("x-forwarded-for") ?? "127.0.0.1").split(',')[0];
        
        // 1. Authentication
        const session = await verifyAuth(req);
        
        // Identify User
        const userId = session?.userId || `ip_${ip}`;
        const tier = (session?.tier as Tier) || 'free';

        // 2. Rate Limiting
        const limitRes = await checkRateLimit(userId, tier);

        // Prepare Log Data
        let geo: any = null;
        try {
            // Lazy require to avoid top-level crash if DB is missing
            // Standard import 'geoip-lite' is heavy and can fail in some envs
            // const geoip = require('geoip-lite');
            // geo = geoip.lookup(ip);
        } catch (e) {
            // Silently fail geoip lookup if database is missing
            // console.warn("GeoIP lookup failed:", e);
        }

        const userAgent = req.headers.get("user-agent") || undefined;
        
        const baseLogData: Partial<SecurityEventLog> = {
            userId: session?.userId,
            userEmail: session?.email || undefined,
            tier: tier,
            ipAddress: ip,
            userAgent: userAgent,
            country: geo?.country,
            city: geo?.city,
            method: req.method,
            endpoint: req.nextUrl.pathname,
        };

        // 3. Enforce Limit
        if (!limitRes.success) {
            await logSecurityEvent({
                ...baseLogData as any,
                statusCode: 429,
                duration: Date.now() - start,
                rateLimitHit: true,
                errorMessage: "Rate Limit Exceeded"
            });

            return new NextResponse(JSON.stringify({ 
                error: "Too Many Requests", 
                retryAfter: limitRes.reset - Math.floor(Date.now() / 1000) 
            }), { 
                status: 429, 
                headers: {
                    "Retry-After": String(limitRes.reset - Math.floor(Date.now() / 1000)),
                    "X-RateLimit-Limit": String(limitRes.limit),
                    "X-RateLimit-Remaining": String(limitRes.remaining),
                    "X-RateLimit-Reset": String(limitRes.reset)
                }
            });
        }

        // 4. Execute Handler
        try {
            const res = await handler(req, context, session);
            
            // Log Result (Async, don't block response)
            logSecurityEvent({
                ...baseLogData as any,
                statusCode: res.status,
                duration: Date.now() - start,
            }).catch(console.error);
            
            // Add Rate Limit Headers
            res.headers.set("X-RateLimit-Limit", String(limitRes.limit));
            res.headers.set("X-RateLimit-Remaining", String(limitRes.remaining));
            res.headers.set("X-RateLimit-Reset", String(limitRes.reset));

            return res;

        } catch (error: any) {
            console.error("API Error:", error);
            
            await logSecurityEvent({
                ...baseLogData as any,
                statusCode: 500,
                duration: Date.now() - start,
                errorMessage: error.message,
                isAnomaly: true
            });
            
            return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
        }
    };
}
