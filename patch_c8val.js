const fs = require('fs');
let content = fs.readFileSync('src/components/database/PrintableReportModal.tsx', 'utf8');

content = content.replace(/const sC10Val = parseNum\(s\.casing10kgPipe\);/g, 'const sC10Val = parseNum(s.casing10kgPipe);\n      const sC8Val = parseNum((s as any).casing8kgPipe);');
content = content.replace(/const sC10 = casing10kgRate \* sC10Val;/g, 'const sC10 = casing10kgRate * sC10Val;\n      const sC8 = casing8kgRate * sC8Val;');
content = content.replace(/const sCost = sDrilling \+ sC10 \+ sC6 \+ sInner;/g, 'const sCost = sDrilling + sC10 + sC8 + sC6 + sInner;');
content = content.replace(/const sTotalExpenditure = sDrilling \+ sC10 \+ sC6 \+ sInner;/g, 'const sTotalExpenditure = sDrilling + sC10 + sC8 + sC6 + sInner;');

fs.writeFileSync('src/components/database/PrintableReportModal.tsx', content);
