import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withSecurity } from '@/lib/api-middleware';

export const GET = withSecurity(async (req, ctx, session) => {
    // 1. Authorization
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 2. Fetch Metrics
    try {
        const [totalRequests, rateLimitHits, recentEvents] = await Promise.all([
            // Total Requests last 24h
            prisma.securityEvent.count({
                where: { timestamp: { gte: oneDayAgo } }
            }),
            // Rate Limit Hits last 24h
            prisma.securityEvent.count({
                where: { 
                    timestamp: { gte: oneDayAgo },
                    rateLimitHit: true
                }
            }),
            // Recent Events
            prisma.securityEvent.findMany({
                take: 20,
                orderBy: { timestamp: 'desc' }
            })
        ]);

        // 3. Chart Data (Group by Hour)
        // Prisma groupBy is supported for MongoDB but sometimes tricky with dates.
        // We can fetch simplified data and aggregate in JS for now (if volume < 100k it's okay for prototype)
        // Or aggregate in Mongo.
        // Let's use raw query if possible, or just fetch timestamps if lightweight.
        // Actually, fetching all timestamps for 24h might be heavy.
        // Let's try to group by hour using JS from a smaller subset or just aggregated counts?
        
        // For MongoDB, Prisma groupBy on Date field groups by specific value. We need truncate.
        // Prisma doesn't support date truncation in groupBy yet natively for Mongo?
        // We will fetch counts per hour via separate queries or aggregator?
        // Separate queries = 24 queries. Fast enough.
        
        // Let's execute 24 queries in parallel for graph points (simple & redundant but works).
        const graphPromises = [];
        for (let i = 23; i >= 0; i--) {
            const start = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000);
            const end = new Date(now.getTime() - i * 60 * 60 * 1000);
            
            graphPromises.push(
                prisma.securityEvent.count({
                    where: { timestamp: { gte: start, lt: end } }
                }).then(count => ({
                    time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: start.toISOString(),
                    requests: count
                }))
            );
        }
        
        const requestGraph = await Promise.all(graphPromises);

        return NextResponse.json({
            summary: {
                totalRequests,
                rateLimitHits,
                errorRate: totalRequests > 0 ? (rateLimitHits / totalRequests * 100).toFixed(2) : 0
            },
            events: recentEvents,
            graph: requestGraph
        });

    } catch (error: any) {
        console.error("Admin Metrics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});
