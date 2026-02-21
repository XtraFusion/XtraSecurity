const fs = require('fs');
const path = 'd:/Projects/XtraSecurity/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import Image from "next/image"')) {
    content = content.replace(
        'import Link from "next/link";',
        'import Link from "next/link";\nimport Image from "next/image";'
    );
}

// Ensure the inline styles with just fontFamily are removed
content = content.replace(/\s*style=\{\{\s*fontFamily:\s*"'Syne', sans-serif"\s*\}\}/g, '');
// And where it might be mixed with other styles
content = content.replace(/,\s*fontFamily:\s*"'Syne', sans-serif"/g, '');
content = content.replace(/fontFamily:\s*"'Syne', sans-serif",?\s*/g, '');

content = content.replace(/text-5xl md:text-7xl/g, 'text-4xl md:text-6xl');
content = content.replace(/text-4xl md:text-5xl/g, 'text-3xl md:text-4xl');
content = content.replace(/text-lg md:text-xl/g, 'text-base md:text-lg');

const newLogo = `{/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white no-underline">
        <Image src="/apple-touch-icon.png" alt="XtraSecurity Logo" width={28} height={28} className="rounded-md" />
        Xtra<span className="text-cyan-400">Security</span>
      </Link>`;

content = content.replace(/\{\/\* Logo \*\/\}\s*<Link [\s\S]*?<\/Link>/, newLogo);

fs.writeFileSync(path, content);
console.log('Update successful!');
