// src/app/dashboard/e-tender/[id]/work-order/page.tsx
"use client";

import React, { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenderData } from '@/components/e-tender/TenderDataContext';
import { formatDateSafe, formatTenderNoForFilename } from '@/components/e-tender/utils';
import { useDataStore } from '@/hooks/use-data-store';
import type { StaffMember } from '@/lib/schemas';
import { numberToWords } from '@/components/e-tender/pdf/generators/utils';
import { Button } from '@/components/ui/button';
import { Copy, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { printDocument, copyDocumentContent } from '@/lib/print-utils';

export default function WorkOrderPrintPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { tender } = useTenderData();
    const { officeAddress, allStaffMembers } = useDataStore();

    useEffect(() => {
        if (tender) {
            const formattedTenderNo = formatTenderNoForFilename(tender.eTenderNo);
            document.title = `eWorkOrder${formattedTenderNo}`;
        }
    }, [tender]);

    const l1Bidder = useMemo(() => {
        if (!tender.bidders || tender.bidders.length === 0) return null;
        const validBidders = tender.bidders.filter(b => b.status === 'Accepted' && typeof b.quotedAmount === 'number' && b.quotedAmount > 0);
        if (validBidders.length === 0) return null;
        return validBidders.reduce((lowest, current) =>
            (current.quotedAmount! < lowest.quotedAmount!) ? current : lowest
        );
    }, [tender.bidders]);

    const hasRejectedBids = useMemo(() => tender.bidders?.some(b => b.status === 'Rejected'), [tender.bidders]);
    const contractAmount = (hasRejectedBids && tender.agreedAmount) ? tender.agreedAmount : (l1Bidder?.quotedAmount ?? tender.agreedAmount ?? tender.contractAmount);
    
    const estimateAmountFormatted = tender.estimateAmount ? `${tender.estimateAmount.toLocaleString('en-IN')} രൂപ` : '__________';
    const agreementAmountFormatted = contractAmount ? `${contractAmount.toLocaleString('en-IN')} രൂപ` : '__________';
    
    // For "Work" type tenders (Malayalam)
    const workOrderTitle = 'വർക്ക് ഓർഡർ';
    const measurer = allStaffMembers.find(s => s.name === tender.nameOfAssistantEngineer);
    const supervisor1 = allStaffMembers.find(s => s.id === tender.supervisor1Id);
    const supervisor2 = allStaffMembers.find(s => s.id === tender.supervisor2Id);
    const supervisor3 = allStaffMembers.find(s => s.id === tender.supervisor3Id);

    const supervisors = useMemo(() => {
        const uniqueStaff = new Map<string, StaffMember>();
        
        // Add measurer first if they exist
        if (measurer && !uniqueStaff.has(measurer.id)) {
            uniqueStaff.set(measurer.id, measurer);
        }

        // Add supervisors if they exist and are not already added
        [supervisor1, supervisor2, supervisor3].forEach(staff => {
            if (staff && !uniqueStaff.has(staff.id)) {
                uniqueStaff.set(staff.id, staff);
            }
        });
        
        return Array.from(uniqueStaff.values());
    }, [measurer, supervisor1, supervisor2, supervisor3]);
    
    const supervisorListText = supervisors.length > 0 
        ? supervisors.map(s => `${s.nameMalayalam || s.name}, ${s.designationMalayalam || s.designation}${s.phoneNo ? ` (ഫോൺ നമ്പർ: ${s.phoneNo})` : ''}`).join(', ') 
        : '____________________';

    const mainParagraph = `മേൽ സൂചന പ്രകാരം ${tender.nameOfWorkMalayalam || tender.nameOfWork} നടപ്പിലാക്കുന്നതിന് വേണ്ടി താങ്കൾ സമർപ്പിച്ചിട്ടുള്ള ടെണ്ടർ അംഗീകരിച്ചു. ടെണ്ടർ ഷെഡ്യൂൾ പ്രവൃത്തികൾ ഏറ്റെടുത്ത് നിശ്ചിത സമയപരിധിയായ <span class="font-semibold">${tender.periodOfCompletion || '___'}</span> ദിവസത്തിനുള്ളിൽ ഈ ഓഫീസിലെ ${supervisorListText} എന്നിവരുടെ മേൽനോട്ടത്തിൽ വിജയകരമായി പൂർത്തിയാക്കി പൂർത്തീകരണ റിപ്പോർട്ടും വർക്ക് ബില്ലും ഓഫീസിൽ ഹാജരാക്കേണ്ടതാണ്.`;
    
    const copyToList = useMemo(() => {
        const uniqueStaff = new Map<string, StaffMember>();

        // 1. Find and add the active Assistant Executive Engineer first
        const asstExecEng = allStaffMembers.find(s => s.designation === "Assistant Executive Engineer" && s.status === 'Active');
        if (asstExecEng) {
            uniqueStaff.set(asstExecEng.id, asstExecEng);
        }

        // 2. Add dynamic members (measurer and supervisors) if they aren't already in the list
        [measurer, supervisor1, supervisor2, supervisor3].forEach(staff => {
            if (staff && !uniqueStaff.has(staff.id)) {
                uniqueStaff.set(staff.id, staff);
            }
        });

        return Array.from(uniqueStaff.values());
    }, [allStaffMembers, measurer, supervisor1, supervisor2, supervisor3]);


    const handleCopyContent = async () => {
        try {
            const success = await copyDocumentContent('work-order-content');
            if (success) {
                toast({
                    title: "Copied!",
                    description: "Work Order content copied with alignments and tables preserved.",
                });
            } else {
                toast({
                    title: "Copy Failed",
                    description: "Could not copy automatically. Please select text manually to copy.",
                    variant: "destructive",
                });
            }
        } catch (err) {
            console.error("Copy error:", err);
            toast({
                title: "Copy Failed",
                description: "An error occurred while copying.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="-m-6 bg-white min-h-screen">
          <style>{`
            @page {
                size: A4 portrait;
                margin-top: 1.25cm !important;
                margin-right: 1.8cm !important;
                margin-bottom: 1.25cm !important;
                margin-left: 2.3cm !important;
            }
            @media print {
                body {
                    background-color: white !important;
                    color: black !important;
                }
                .no-print {
                    display: none !important;
                }
                #work-order-content {
                    padding: 0 !important;
                    margin: 0 !important;
                    max-width: 100% !important;
                }
                ol {
                    list-style-type: decimal !important;
                }
            }
          `}</style>
          <div id="work-order-content" className="max-w-4xl print:max-w-none mx-auto p-8 space-y-4 font-serif text-base" style={{ fontFamily: "'Times New Roman', 'Suruma', 'Kartika', serif", fontSize: '12pt', color: '#000000' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', fontSize: '13pt', marginBottom: '12px' }}>
                  &quot;ഭരണഭാഷ-മാതൃഭാഷ&quot;
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '8px', marginBottom: '16px' }}>
                  <tbody>
                      <tr>
                          <td align="left" valign="top" style={{ width: '50%', verticalAlign: 'top', textAlign: 'left', fontSize: '12pt', lineHeight: '1.5', border: 'none', padding: '8px 8px 8px 0' }}>
                              <p style={{ margin: 0, padding: 0 }}>നമ്പർ: {officeAddress?.officeCode || 'GKT'} / {tender.fileNo || '__________'}</p>
                              <p style={{ margin: 0, padding: 0 }}>ടെണ്ടർ നമ്പർ : {tender.eTenderNo || '__________'}</p>
                          </td>
                          <td align="right" valign="top" style={{ width: '50%', verticalAlign: 'top', textAlign: 'right', fontSize: '12pt', lineHeight: '1.5', border: 'none', padding: '8px 0 8px 8px' }}>
                              {(() => {
                                  const addrMalayalam = officeAddress?.addressMalayalam || "ജില്ലാ ഓഫീസറുടെ കാര്യാലയം\nഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്\nഹൈസ്കൂൾ ജംഗ്ഷൻ, തേവള്ളി പി. ഓ.\nകൊല്ലം - 691009";
                                  const lines = addrMalayalam.split('\n').map(l => l.trim()).filter(Boolean);
                                  return lines.map((line, idx) => (
                                      <p key={idx} style={{ margin: 0, padding: 0 }}>{line}</p>
                                  ));
                              })()}
                              <p style={{ margin: 0, padding: 0 }}>ഫോൺനമ്പർ: {officeAddress?.phoneNo || ''}</p>
                              <p style={{ margin: 0, padding: 0 }}>ഇമെയിൽ: {officeAddress?.email || ''}</p>
                              <p style={{ margin: 0, padding: 0 }}>തീയതി: {formatDateSafe(tender.dateWorkOrder) || '__________'}</p>
                          </td>
                      </tr>
                  </tbody>
              </table>

              <div style={{ marginTop: '16px', fontSize: '12pt' }}>
                  <p style={{ margin: 0, padding: 0 }}>പ്രേഷകൻ</p>
                  <p style={{ margin: '0 0 0 32px', padding: 0 }}>ജില്ലാ ഓഫീസർ</p>
              </div>
              
              <div style={{ marginTop: '12px', fontSize: '12pt' }}>
                  <p style={{ margin: 0, padding: 0 }}>സ്വീകർത്താവ്</p>
                  <div style={{ margin: '0 0 0 32px', padding: 0, minHeight: '60px' }}>
                      <p style={{ margin: 0, padding: 0, fontSize: '13pt', fontWeight: 'bold' }}>{l1Bidder?.name || '____________________'}</p>
                      <p style={{ margin: 0, padding: 0, fontSize: '12pt' }}>{l1Bidder?.address || '____________________'}</p>
                  </div>
              </div>
              
              <div style={{ marginTop: '12px', fontSize: '12pt' }}>
                  <p style={{ margin: 0, padding: 0 }}>സർ,</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '12px', marginBottom: '12px', fontSize: '12pt' }}>
                  <tbody>
                      <tr>
                          <td valign="top" style={{ width: '85px', minWidth: '85px', whiteSpace: 'nowrap', padding: '6px 8px 6px 0', fontWeight: 'bold', verticalAlign: 'top', border: 'none' }}>
                              വിഷയം:
                          </td>
                          <td valign="top" align="justify" style={{ verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.5', padding: '6px 0', border: 'none' }}>
                              {tender.nameOfWorkMalayalam || tender.nameOfWork} - ടെണ്ടർ അംഗീകരിച്ച് {workOrderTitle} നൽകുന്നത്– സംബന്ധിച്ച്.
                          </td>
                      </tr>
                      <tr>
                          <td valign="top" style={{ width: '85px', minWidth: '85px', whiteSpace: 'nowrap', padding: '6px 8px 6px 0', fontWeight: 'bold', verticalAlign: 'top', border: 'none' }}>
                              സൂചന:
                          </td>
                          <td valign="top" align="left" style={{ verticalAlign: 'top', textAlign: 'left', lineHeight: '1.5', padding: '6px 0', border: 'none' }}>
                              <p style={{ margin: 0, padding: 0 }}>1. ഈ ഓഫീസിലെ {formatDateSafe(tender.dateOfOpeningBid) || '__________'} തീയതിയിലെ ടെണ്ടർ നമ്പർ {tender.eTenderNo || '__________'}</p>
                              <p style={{ margin: 0, padding: 0 }}>2. വർക്ക് എഗ്രിമെന്റ് നമ്പർ {tender.agreementNo || tender.eTenderNo || '__________'} തീയതി {formatDateSafe(tender.agreementDate) || '__________'}</p>
                          </td>
                      </tr>
                  </tbody>
              </table>

              <div style={{ marginTop: '12px', fontSize: '12pt', textAlign: 'justify', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: mainParagraph }} />

              <div style={{ marginTop: '12px', marginBottom: '14px', fontSize: '12pt', lineHeight: '1.6' }}>
                  <p style={{ margin: 0, padding: 0 }}>
                      <span style={{ fontWeight: 'bold' }}>എസ്റ്റിമേറ്റ് തുക: </span>
                      {estimateAmountFormatted}
                  </p>
                  <p style={{ margin: 0, padding: 0 }}>
                      <span style={{ fontWeight: 'bold' }}>എഗ്രിമെന്റ് തുക: </span>
                      {agreementAmountFormatted}
                  </p>
              </div>

              <div style={{ marginTop: '14px', fontSize: '12pt' }}>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '8px' }}>നിബന്ധനകൾ</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '4px', fontSize: '12pt' }}>
                    <tbody>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>1.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                എല്ലാ വർക്കുകളും തുടങ്ങേണ്ടതും പൂർത്തീകരിക്കേണ്ടതും വകുപ്പ് സൂപ്പർവിഷന് നിയോഗിക്കുന്ന ഉദ്യോഗസ്ഥന്റെ സാന്നിധ്യത്തിൽ ആയിരിക്കണം.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>2.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                കുഴൽകിണർ നിർമ്മാണം, ട്യൂബ് വെൽ നിർമ്മാണം, കുടിവെള്ള പദ്ധതി, കൃത്രിമ ഭൂജലസംപോഷണ പദ്ധതി എന്നിവയ്ക്കായി ഉപയോഗിക്കുന്ന പൈപ്പുകളുടെ ISI മുദ്ര, ബ്യൂറോ ഓഫ് ഇന്ത്യൻ സ്റ്റാൻഡേർഡ്‌സ്‌ അംഗീകരിച്ചിട്ടുള്ള ലിസ്റ്റിൽ ഉൾപ്പെടുന്നതായിരിക്കണം. ആയത് സംബന്ധിച്ച ഗുണനിലവാര സർട്ടിഫിക്കറ്റ് പ്രവൃത്തി നിർവഹണത്തിന് മുന്നോടിയായി ഓഫീസിൽ സമർപ്പിക്കേണ്ടതാണ്.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>3.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                വർക്ക് ഓർഡർ ലഭിച്ചതിന് <span style={{ fontWeight: 'bold' }}>5</span> ദിവസത്തിനകം വർക്ക് തുടങ്ങിയിരിക്കേണ്ടതും, വർക്ക് ഓർഡറിൽ പറഞ്ഞിരിക്കുന്ന നിശ്ചിത ദിവസത്തിനകം വർക്ക് പൂർത്തീകരിക്കുകയും ചെയ്യേണ്ടതാണ്.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>4.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                കുടിവെള്ളപദ്ധതികൾക്കായി വാട്ടർ ടാങ്ക് സ്ഥാപിക്കുന്ന ആംഗിൾ അയൺ അഥവാ കോൺക്രീറ്റ് സ്ട്രക്ച്ചർ / കോൺക്രീറ്റ് അഥവാ സ്റ്റീൽ പമ്പ് ഹൌസ് / ഹൈഡ്രന്റ് / വെൽ പ്രൊട്ടക്ഷൻ കവർ തുടങ്ങിയ എല്ലാ പ്രവൃത്തികളും പൂർത്തികരിക്കുന്നത് എസ്റ്റിമേറ്റിൽ പറഞ്ഞിരിക്കുന്ന അളവിലും തന്നിരിക്കുന്ന ഡ്രോയിംഗിന്റെ അടിസ്ഥാനത്തിലും ആയിരിക്കണം.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>5.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                എസ്റ്റിമേറ്റിൽ പറഞ്ഞിരിക്കുന്ന സ്പെസിഫിക്കേഷൻ പ്രകാരം ഉള്ള വസ്തുക്കൾ മാത്രമാണ് പ്രവൃത്തിയ്ക്ക് ഉപയോഗിക്കേണ്ടത്.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>6.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                വർക്ക് പൂർത്തീകരിച്ച് കംപ്ലീഷൻ സർട്ടിഫിക്കറ്റ് ഉൾപ്പെടെ ബിൽ സമർപ്പിക്കേണ്ടതാണ്. ഫണ്ടിന്റെ ലഭ്യത അനുസരിച്ചാണ് ബിൽ തുക മാറി നൽകുന്നത്.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>7.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                പ്രവൃത്തി തൃപ്തികരമല്ലാത്ത പക്ഷം ബിൽ തുക മാറി നൽകുന്നതല്ല.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>8.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                പ്രവൃത്തിക്ക് വേണ്ട നിശ്ചിത സമയ പരിധി നിർബന്ധമായും പാലിക്കേണ്ടതാണ്.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>9.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                കുടിവെള്ളപദ്ധതിയുടെ കെട്ടിട നമ്പർ, കറണ്ട് കണക്ഷൻ എന്നിവ എടുത്ത് സ്‌കീം പൂർത്തീകരിച്ച് ഓണർഷിപ്പ് സർട്ടിഫിക്കറ്റ് ലഭ്യമാക്കേണ്ടത് കോൺട്രാക്ടറുടെ ചുമതലയാണ്.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>10.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                കാലാ കാലങ്ങളിൽ ഉള്ള സർക്കാർ ഉത്തരവുകൾ ഈ പ്രവൃത്തിക്കും ബാധകമായിരിക്കും.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>11.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                സൈറ്റ് പരിതസ്ഥിതികൾക്ക് വിധേയമായി എന്തെങ്കിലും മാറ്റം നിർമ്മാണ ഘട്ടത്തിൽ പ്രവൃത്തിക്ക് വേണ്ടാതായി കാണുന്നുവെങ്കിൽ അത് ബന്ധപ്പെട്ട ഉദ്യോഗസ്ഥരുടെ നിർദ്ദേശാനുസരണം മാത്രം ചെയ്യേണ്ടതാണ് .
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>12.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                ഒരു കാരണവശാലും സ്‌കീമിന്റെ അന്തസത്തയ്ക്ക് കാതലായ മാറ്റം വരുത്തുന്ന രീതിയിലുള്ള രൂപഭേദങ്ങൾ വരുത്താൻ പാടില്ല.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>13.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                പ്രവൃത്തിയെക്കുറിച്ചുള്ള ഏതൊരു അന്തിമ തീരുമാനവും ജില്ലാ ഓഫീസറിൽ നിക്ഷിപ്തമായിരിക്കും.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>14.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                കരാറുടമ്പടി പ്രകാരം പ്രവൃത്തി പൂർത്തിയാക്കുന്നതിൽ കരാറുകാരൻ വീഴ്ച വരുത്തുകയാണെങ്കിൽ നിയമനുസൃതം നോട്ടീസ് അയച്ച് പതിന്നാല് ദിവസങ്ങൾക്ക് ശേഷം കരാർ റദ്ദാക്കാവുന്നതും മറ്റൊരു കരാറുകാരൻ വഴി പ്രവൃത്തി പൂർത്തിയാക്കാവുന്നതുമാണ്. അങ്ങനെ ചെയ്യുമ്പോൾ ഉണ്ടാകുന്ന അധിക ചെലവ് മുഴുവൻ കരാറുകാരന്റെ ബിൽ തുകയിൽ നിന്നും, ജാമ്യ നിക്ഷേപത്തിൽ നിന്നും, സ്ഥാവര ജംഗമ സ്വത്തുക്കളിൽ നിന്നും വസൂലാക്കുന്നതാണ്.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '3px 4px 3px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.6' }}>15.</td>
                            <td valign="top" align="justify" style={{ border: 'none', padding: '3px 0', verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.6' }}>
                                തൃപ്തികരമല്ലെന്ന് കാണുന്ന പ്രവൃത്തിയോ അല്ലെങ്കിൽ ഗുണനിലവാരമില്ലാത്ത സാധനങ്ങൾ ഉപയോഗിച്ചു കൊണ്ടുള്ള പ്രവൃത്തിയോ വകുപ്പ് നിർദ്ദേശിക്കുന്ന രീതിയിൽ പൊളിച്ചു മാറ്റി, ഗുണനിലവാരമുള്ള സാധനങ്ങൾ ഉപയോഗിച്ചു കൊണ്ട് കരാറുടമ്പടിയിൽ നിഷ്കർഷിക്കുന്ന രൂപത്തിലും ഘടനയിലും പുനർനിർമ്മിക്കുന്നതിന് കരാറുകാരൻ ബാധ്യസ്ഥനാണ്. അല്ലാത്ത പക്ഷം വകുപ്പിന്റെ യുക്തം പോലെ പിഴ ചുമത്തുന്നതാണ്.
                            </td>
                        </tr>
                    </tbody>
                </table>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '30px', fontSize: '12pt' }}>
                  <tbody>
                      <tr>
                          <td style={{ width: '50%' }}></td>
                          <td align="right" valign="top" style={{ width: '50%', textAlign: 'right', verticalAlign: 'top' }}>
                              <p style={{ margin: 0, padding: 0 }}>വിശ്വസ്തതയോടെ</p>
                              <div style={{ height: '40px' }}></div>
                              <p style={{ margin: 0, padding: 0, fontWeight: 'bold' }}>ജില്ലാ ഓഫീസർ</p>
                          </td>
                      </tr>
                  </tbody>
              </table>

              <div style={{ marginTop: '20px', fontSize: '12pt' }}>
                  <p style={{ margin: 0, padding: 0 }}>പകർപ്പ്</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '4px', fontSize: '12pt' }}>
                      <tbody>
                          {copyToList.map((person, index) => (
                              <tr key={index}>
                                  <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '2px 4px 2px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.4' }}>{index + 1}.</td>
                                  <td valign="top" align="left" style={{ border: 'none', padding: '2px 0', verticalAlign: 'top', textAlign: 'left', lineHeight: '1.4' }}>{person.nameMalayalam || person.name}, {person.designationMalayalam || person.designation}</td>
                              </tr>
                          ))}
                          <tr>
                              <td valign="top" style={{ width: '28px', whiteSpace: 'nowrap', padding: '2px 4px 2px 0', border: 'none', verticalAlign: 'top', lineHeight: '1.4' }}>{copyToList.length + 1}.</td>
                              <td valign="top" align="left" style={{ border: 'none', padding: '2px 0', verticalAlign: 'top', textAlign: 'left', lineHeight: '1.4' }}>ഫയൽ</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
          <div className="fixed bottom-4 right-4 no-print flex gap-2 bg-white/95 p-2 rounded-lg border shadow-lg backdrop-blur z-50">
            <Button 
                variant="outline" 
                onClick={() => {
                    if (window.opener) {
                        window.close();
                    } else if (tender.id) {
                        const query = searchParams?.toString();
                        router.push(`/dashboard/e-tender/${tender.id}${query ? `?${query}` : ''}#pdf-reports-section`);
                    } else {
                        const query = searchParams?.toString();
                        router.push(`/dashboard/e-tender${query ? `?${query}` : ''}`);
                    }
                }}
            >
                Close
            </Button>
            <Button variant="outline" onClick={handleCopyContent} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
                <Copy className="h-4 w-4" />
                Copy
            </Button>
            <Button onClick={() => printDocument('work-order-content', document.title || 'Work Order', '1.25cm 1.8cm 1.25cm 2.3cm')} className="gap-1.5">
                <Printer className="h-4 w-4" />
                Print
            </Button>
          </div>
        </div>
    );
}
