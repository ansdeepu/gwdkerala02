#!/bin/bash
sed -i 's/fb_q2: () => setCasing10kgQty(parseNum(currentSite?.casing10kgPipe)),/fb_q2: () => setCasing10kgQty(parseNum(currentSite?.casing10kgPipe)),\n    fb_r2_8: () => setCasing8kgRate(464.53),\n    fb_q2_8: () => setCasing8kgQty(parseNum((currentSite as any)?.casing8kgPipe)),/g' src/components/database/PrintableReportModal.tsx
