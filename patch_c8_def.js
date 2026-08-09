const fs = require('fs');
let content = fs.readFileSync('src/components/database/PrintableReportModal.tsx', 'utf8');

content = content.replace(/const c10 = parseNum\(currentSite\.casing10kgPipe\);/g, 'const c10 = parseNum(currentSite.casing10kgPipe);\n      const c8 = parseNum((currentSite as any).casing8kgPipe);');
content = content.replace(/const c10 = parseNum\(currentSite\?\.casing10kgPipe\);/g, 'const c10 = parseNum(currentSite?.casing10kgPipe);\n      const c8 = parseNum((currentSite as any)?.casing8kgPipe);');

fs.writeFileSync('src/components/database/PrintableReportModal.tsx', content);
