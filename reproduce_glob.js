const glob = require('glob');
const path = require('path');

console.log('CWD:', process.cwd());

function testGlob(pattern) {
    console.log(`\n--- Testing glob pattern: ${pattern} ---`);
    try {
        glob(pattern, { dot: true }, (er, files) => {
            if (er) console.error('glob error:', er);
            else console.log(`glob found ${files.length} entries.`);
        });
    } catch (e) {
        console.error('glob unexpected error:', e);
    }
}

// Test potentially dangerous patterns
testGlob('**/*');
testGlob('../**/*'); // Test parent traversal
