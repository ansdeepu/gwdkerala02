const fs = require('fs');
let content = fs.readFileSync('src/components/database/PrintableReportModal.tsx', 'utf8');

content = content.replace(/const localCasing10Total = casing10kgRate \* c10;\n      const localCasing6Total = casing6kgRate \* c6;/, 'const localCasing10Total = casing10kgRate * c10;\n      const localCasing8Total = casing8kgRate * c8;\n      const localCasing6Total = casing6kgRate * c6;');
content = content.replace(/localTotalExpenditure = localDrillingTotal \+ localCasing10Total \+ localCasing6Total \+ localInnerTotal;/, 'localTotalExpenditure = localDrillingTotal + localCasing10Total + localCasing8Total + localCasing6Total + localInnerTotal;');

fs.writeFileSync('src/components/database/PrintableReportModal.tsx', content);
