/**
 * Cleanup script: Delete old security events to free MongoDB Atlas space.
 * Run with: npx ts-node scripts/cleanup-security-events.ts
 */
import prisma from "../lib/db";

async function cleanup() {
    // Keep only last 7 days of security events
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    console.log(`Deleting security events older than ${cutoffDate.toISOString()}...`);

    const result = await prisma.securityEvent.deleteMany({
        where: {
            timestamp: {
                lt: cutoffDate
            }
        }
    });

    console.log(`✅ Deleted ${result.count} old security events`);

    // Show remaining count
    const remaining = await prisma.securityEvent.count();
    console.log(`📊 Remaining security events: ${remaining}`);

    await prisma.$disconnect();
}

cleanup().catch(e => {
    console.error("Cleanup failed:", e);
    process.exit(1);
});
