const fs = require('fs');
let content = fs.readFileSync('src/components/database/PrintableReportModal.tsx', 'utf8');

content = content.replace(/const sHas10kg = s\.casing10kgPipe !== undefined && s\.casing10kgPipe !== null;/g, 'const sHas10kg = s.casing10kgPipe !== undefined && s.casing10kgPipe !== null;\n      const sHas8kg = (s as any).casing8kgPipe !== undefined && (s as any).casing8kgPipe !== null;');
content = content.replace(/const sC6Val = sHas6kg \? sC6Raw : \(\!sHas10kg && sC10Val === 0 \? \(sPipeUsed \|\| sSurveyCasing\) : 0\);/g, 'const sC6Val = sHas6kg ? sC6Raw : (!sHas10kg && !sHas8kg && sC10Val === 0 && sC8Val === 0 ? (sPipeUsed || sSurveyCasing) : 0);');

fs.writeFileSync('src/components/database/PrintableReportModal.tsx', content);
