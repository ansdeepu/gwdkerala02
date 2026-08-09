const fs = require('fs');
let content = fs.readFileSync('src/components/database/PrintableReportModal.tsx', 'utf8');

content = content.replace(/casing10kgPipe: casing10kgQty !== undefined casing10kgPipe: [^\n]+/, 'casing10kgPipe: casing10kgQty !== undefined && casing10kgQty !== null ? String(casing10kgQty) : (updatedSiteDetails[originalIndex].casing10kgPipe ?? ""),');
content = content.replace(/casing8kgPipe: casing8kgQty !== undefined casing10kgPipe: [^\n]+/, 'casing8kgPipe: casing8kgQty !== undefined && casing8kgQty !== null ? String(casing8kgQty) : ((updatedSiteDetails[originalIndex] as any).casing8kgPipe ?? ""),');

fs.writeFileSync('src/components/database/PrintableReportModal.tsx', content);
