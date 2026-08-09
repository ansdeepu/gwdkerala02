const fs = require('fs');
let content = fs.readFileSync('src/components/database/PrintableReportModal.tsx', 'utf8');

const target1 = `                      total: casing10kgTotal
                    },
                    {
                      qty: casing6kgQty,
                      descId: 'fb_desc_casing6_ml',`;

const replacement1 = `                      total: casing10kgTotal
                    },
                    {
                      qty: casing8kgQty,
                      descId: 'fb_desc_casing8_ml',
                      descValue: fbDescCasing8Ml,
                      descEl: <Input className="h-6 text-xs" value={fbDescCasing8Ml} onChange={e => setFbDescCasing8Ml(e.target.value)} />,
                      rateId: 'fb_r2_8',
                      rateValue: casing8kgRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={casing8kgRate} onChange={e => setCasing8kgRate(Number(e.target.value))} />,
                      qtyId: 'fb_q2_8',
                      qtyText: \`\${casing8kgQty} മീറ്റർ\`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={casing8kgQty} onChange={e => setCasing8kgQty(Number(e.target.value))} />,
                      total: casing8kgTotal
                    },
                    {
                      qty: casing6kgQty,
                      descId: 'fb_desc_casing6_ml',`;
                      
const target2 = `                      total: casing10kgTotal
                    },
                    {
                      qty: casing6kgQty,
                      descId: 'fb_desc_casing6_en',`;

const replacement2 = `                      total: casing10kgTotal
                    },
                    {
                      qty: casing8kgQty,
                      descId: 'fb_desc_casing8_en',
                      descValue: fbDescCasing8En,
                      descEl: <Input className="h-6 text-xs" value={fbDescCasing8En} onChange={e => setFbDescCasing8En(e.target.value)} />,
                      rateId: 'fb_en_r2_8',
                      rateValue: casing8kgRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={casing8kgRate} onChange={e => setCasing8kgRate(Number(e.target.value))} />,
                      qtyId: 'fb_en_q2_8',
                      qtyText: \`\${casing8kgQty} m\`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={casing8kgQty} onChange={e => setCasing8kgQty(Number(e.target.value))} />,
                      total: casing8kgTotal
                    },
                    {
                      qty: casing6kgQty,
                      descId: 'fb_desc_casing6_en',`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);

fs.writeFileSync('src/components/database/PrintableReportModal.tsx', content);
