const fs = require('fs');
const path = require('path');

const root = process.cwd();
const seen = new Set();

function walk(dir) {
    if (seen.has(dir)) return;
    seen.add(dir);

    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filepath = path.join(dir, file);
            try {
                const stats = fs.lstatSync(filepath);
                if (stats.isSymbolicLink()) {
                    const target = fs.readlinkSync(filepath);
                    const absoluteTarget = path.resolve(path.dirname(filepath), target);
                    if (!absoluteTarget.startsWith(root)) {
                        console.log(`EXTERNAL SYMLINK: ${filepath} -> ${target} (${absoluteTarget})`);
                    }
                } else if (stats.isDirectory()) {
                    // unexpected loop protection
                    if (file !== '.git') walk(filepath);
                }
            } catch (e) {
                // ignore access errors on files
            }
        });
    } catch (e) {
        if (e.code !== 'ENOENT' && e.code !== 'EPERM' && e.code !== 'EACCES')
            console.error(`Error reading ${dir}: ${e.message}`);
    }
}

console.log('Searching for deep symlinks in node_modules...');
walk(path.join(root, 'node_modules'));
console.log('Search complete.');
