const fs = require('fs');
let content = fs.readFileSync('src/components/database/PrintableReportModal.tsx', 'utf8');

content = content.replace(/casing10Qty: sC10Val,\n        casing10Cost: sC10,/, 'casing10Qty: sC10Val,\n        casing10Cost: sC10,\n        casing8Qty: sC8Val,\n        casing8Cost: sC8,');
content = content.replace(/casing10Qty: number;\n      casing10Cost: number;/, 'casing10Qty: number;\n      casing10Cost: number;\n      casing8Qty: number;\n      casing8Cost: number;');

fs.writeFileSync('src/components/database/PrintableReportModal.tsx', content);
