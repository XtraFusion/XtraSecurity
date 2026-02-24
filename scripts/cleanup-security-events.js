const { PrismaClient } = require('../lib/generated/prisma/index.js');
const prisma = new PrismaClient();

async function cleanup() {
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() - 30);

    const cutoff7 = new Date();
    cutoff7.setDate(cutoff7.getDate() - 7);

    console.log('🧹 Starting database cleanup...\n');

    // 1. Delete old notifications (older than 30 days)
    try {
        const notifs = await prisma.notification.deleteMany({
            where: { createdAt: { lt: cutoff30 } }
        });
        console.log(`✅ Deleted ${notifs.count} old notifications (>30 days)`);
    } catch (e) { console.log('⚠️  Notifications cleanup failed:', e.message); }

    // 2. Delete old audit logs (older than 30 days)
    try {
        const audits = await prisma.auditLog.deleteMany({
            where: { createdAt: { lt: cutoff30 } }
        });
        console.log(`✅ Deleted ${audits.count} old audit logs (>30 days)`);
    } catch (e) { console.log('⚠️  AuditLog cleanup failed:', e.message); }

    // 3. Delete all security events older than 7 days
    try {
        const secEvents = await prisma.securityEvent.deleteMany({
            where: { timestamp: { lt: cutoff7 } }
        });
        console.log(`✅ Deleted ${secEvents.count} old security events (>7 days)`);
    } catch (e) { console.log('⚠️  SecurityEvent cleanup failed:', e.message); }

    // 4. Delete expired sessions
    try {
        const sessions = await prisma.session.deleteMany({
            where: { expires: { lt: new Date() } }
        });
        console.log(`✅ Deleted ${sessions.count} expired sessions`);
    } catch (e) { console.log('⚠️  Session cleanup failed:', e.message); }

    // 5. Delete old break glass sessions
    try {
        const bgSessions = await prisma.breakGlassSession.deleteMany({
            where: { createdAt: { lt: cutoff30 } }
        });
        console.log(`✅ Deleted ${bgSessions.count} old break glass sessions (>30 days)`);
    } catch (e) { console.log('⚠️  BreakGlassSession cleanup failed:', e.message); }

    // 6. Delete old access reviews
    try {
        const reviews = await prisma.accessReview.deleteMany({
            where: { createdAt: { lt: cutoff30 } }
        });
        console.log(`✅ Deleted ${reviews.count} old access reviews (>30 days)`);
    } catch (e) { console.log('⚠️  AccessReview cleanup failed:', e.message); }

    console.log('\n📊 Current remaining counts:');
    const models = [
        ['Notification', () => prisma.notification.count()],
        ['AuditLog', () => prisma.auditLog.count()],
        ['SecurityEvent', () => prisma.securityEvent.count()],
        ['Session', () => prisma.session.count()],
        ['Secret', () => prisma.secret.count()],
        ['Project', () => prisma.project.count()],
    ];
    for (const [name, fn] of models) {
        try {
            const count = await fn();
            console.log(`  ${name}: ${count}`);
        } catch (e) {
            console.log(`  ${name}: error - ${e.message}`);
        }
    }

    await prisma.$disconnect();
    console.log('\n✅ Done!');
}

cleanup().catch(e => {
    console.error('Fatal error:', e.message);
    prisma.$disconnect();
    process.exit(1);
});
