const fs = require('fs');
let content = fs.readFileSync('src/components/database/PrintableReportModal.tsx', 'utf8');

content = content.replace(/const is10kgDefined = currentSite\.casing10kgPipe !== undefined && currentSite\.casing10kgPipe !== null;/g, 'const is10kgDefined = currentSite.casing10kgPipe !== undefined && currentSite.casing10kgPipe !== null;\n      const is8kgDefined = (currentSite as any).casing8kgPipe !== undefined && (currentSite as any).casing8kgPipe !== null;');
content = content.replace(/if \(!is6kgDefined && !is10kgDefined && c10 === 0 && c6 === 0\)/g, 'if (!is6kgDefined && !is8kgDefined && !is10kgDefined && c10 === 0 && c8 === 0 && c6 === 0)');

content = content.replace(/const is10kgDefined = currentSite\?\.casing10kgPipe !== undefined && currentSite\?\.casing10kgPipe !== null;/g, 'const is10kgDefined = currentSite?.casing10kgPipe !== undefined && currentSite?.casing10kgPipe !== null;\n      const is8kgDefined = (currentSite as any)?.casing8kgPipe !== undefined && (currentSite as any)?.casing8kgPipe !== null;');
content = content.replace(/const c6 = is6kgDefined \? rawC6 : \(!is10kgDefined && c10 === 0 \? \(rawPipeUsed \|\| rawSurveyCasing\) : 0\);/g, 'const c6 = is6kgDefined ? rawC6 : (!is10kgDefined && !is8kgDefined && c10 === 0 && c8 === 0 ? (rawPipeUsed || rawSurveyCasing) : 0);');

fs.writeFileSync('src/components/database/PrintableReportModal.tsx', content);
