const fs = require('fs');
const path = require('path');

function walk(dir) {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filepath = path.join(dir, file);
            try {
                const stats = fs.lstatSync(filepath);
                if (stats.isSymbolicLink()) {
                    console.log(`SYMLINK: ${filepath} -> ${fs.readlinkSync(filepath)}`);
                } else if (stats.isDirectory() && file !== 'node_modules' && file !== '.git') {
                    // Don't recurse into node_modules or .git for now, unless requested
                    // specific check for top level
                    walk(filepath);
                }
            } catch (e) {
                console.error(`Error checking ${filepath}: ${e.message}`);
            }
        });
    } catch (e) {
        if (e.code !== 'EPERM') console.error(`Error reading ${dir}: ${e.message}`);
    }
}

console.log('Checking root...');
walk('.');

console.log('Checking node_modules links...');
try {
    const modules = fs.readdirSync('node_modules');
    modules.forEach(m => {
        const mp = path.join('node_modules', m);
        const s = fs.lstatSync(mp);
        if (s.isSymbolicLink()) {
            console.log(`MODULE SYMLINK: ${mp} -> ${fs.readlinkSync(mp)}`);
        }
        if (m.startsWith('@')) {
            try {
                const sub = fs.readdirSync(mp);
                sub.forEach(sm => {
                    const smp = path.join(mp, sm);
                    const ss = fs.lstatSync(smp);
                    if (ss.isSymbolicLink()) {
                        console.log(`SCOPED SYMLINK: ${smp} -> ${fs.readlinkSync(smp)}`);
                    }
                });
            } catch (e) { }
        }
    });
} catch (e) { console.log('No node_modules or error', e.message); }
