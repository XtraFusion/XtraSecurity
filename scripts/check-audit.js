
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAudit() {
    try {
        const total = await prisma.auditLog.count();
        const withWorkspace = await prisma.auditLog.count({
            where: { workspaceId: { not: null } }
        });
        const latest = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 5,
            include: { user: { select: { email: true } } }
        });

        console.log('--- Audit Log Summary ---');
        console.log(`Total Logs: ${total}`);
        console.log(`Logs with workspaceId: ${withWorkspace}`);
        console.log('\nLatest 5 Logs:');
        latest.forEach(log => {
            console.log(`[${log.timestamp.toISOString()}] ${log.user?.email || 'unknown'}: ${log.action} (WS: ${log.workspaceId || 'none'})`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAudit();
