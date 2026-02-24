const { PrismaClient } = require('../lib/generated/prisma/index.js');
const prisma = new PrismaClient();

async function checkCounts() {
    const results = await Promise.all([
        prisma.securityEvent.count().then(c => ({ model: 'SecurityEvent', count: c })),
        prisma.secret.count().then(c => ({ model: 'Secret', count: c })),
        prisma.project.count().then(c => ({ model: 'Project', count: c })),
        prisma.workspace.count().then(c => ({ model: 'Workspace', count: c })),
        prisma.user.count().then(c => ({ model: 'User', count: c })),
        prisma.team.count().then(c => ({ model: 'Team', count: c })),
        prisma.notification.count().then(c => ({ model: 'Notification', count: c })),
        prisma.auditLog.count().then(c => ({ model: 'AuditLog', count: c })).catch(() => ({ model: 'AuditLog', count: 'N/A' })),
        prisma.secretHistory.count().then(c => ({ model: 'SecretHistory', count: c })).catch(() => ({ model: 'SecretHistory', count: 'N/A' })),
    ]);

    console.log('\n📊 Collection Counts:');
    results.sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0))
        .forEach(r => console.log(`  ${r.model}: ${r.count}`));

    await prisma.$disconnect();
}

checkCounts().catch(e => {
    console.error('Error:', e.message);
    prisma.$disconnect();
});
