const fs = require('fs');
const path = 'd:\\Projects\\XtraSecurity\\app\\rotation\\page.tsx';
try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');
    if (lines.length > 800) {
        console.log(`Original line count: ${lines.length}`);
        // Keep first 736 lines
        const newContent = lines.slice(0, 736).join('\n');
        fs.writeFileSync(path, newContent);
        console.log('File truncated to 736 lines.');
    } else {
        console.log('File is already short enough.');
    }
} catch (e) {
    console.error(e);
}
