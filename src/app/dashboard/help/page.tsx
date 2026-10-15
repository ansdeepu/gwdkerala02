"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePageHeader } from "@/hooks/usePageHeader";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from '@/hooks/useAuth';
import {
    HelpCircle,
    LifeBuoy,
    Building,
    Server,
    LayoutDashboard,
    ScrollText,
    ImageUp,
    Hammer,
    Truck,
    Code,
    Bot,
    Palette,
    Database,
    ShieldCheck,
    UserPlus,
    RefreshCw,
    TestTube2,
    Droplets,
    Waves,
    History,
    MapPin,
    Save,
    ExternalLink,
    Briefcase,
    Zap,
    ShieldAlert,
    Image as ImageIcon,
    FileStack
} from 'lucide-react';



export default function HelpPage() {
  const { setHeader } = usePageHeader();
  const { user } = useAuth();
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    setHeader("Help & About", "Find answers to common questions and learn more about the application.");
    setLastUpdated(format(new Date(), 'dd MMM yyyy, hh:mm a'));
  }, [setHeader]);

  return (
    <div className="space-y-6">
      {/* 1. About Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle>About the Ground Water Department</CardTitle>
          </div>
          <CardDescription>
            An overview of the department and the purpose of this application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-justify">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Ground Water Department, {user?.officeLocation ? capitalize(user.officeLocation) : 'Kerala'}</h3>
            <p className="text-sm text-muted-foreground">
              The Ground Water Department is the state-level agency entrusted with the development, management, conservation, and regulation of precious ground water resources. The department provides technical guidance for various schemes, including well construction, groundwater recharge projects, and water supply systems for both government and private sectors. Its key services involve hydrogeological surveys, drilling, and monitoring to ensure the sustainable use of groundwater for drinking, agriculture, and industrial purposes.
            </p>
          </div>
           <div className="pt-4 border-t">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Server className="h-4 w-4" /> Digital Transformation</h3>
            <p className="text-sm text-muted-foreground">
              This centralized dashboard digitizes departmental workflows to enhance efficiency, accuracy, and real-time monitoring across all district offices. It manages the entire project lifecycle—from investigation and tendering to implementation and financial closure.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Admin & Super Admin Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-blue-700"><Briefcase className="h-4 w-4"/>Office Onboarding Guide</CardTitle>
                <CardDescription className="text-blue-600/80">Essential first steps for new Sub-Office Administrators.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-blue-900/80 space-y-3">
                <p>When an office is first activated, the Office Admin should perform these actions in order:</p>
                <ol className="list-decimal pl-5 space-y-2">
                    <li><strong>Configure Office Details:</strong> Go to the Settings page and fill in the office address (English & Malayalam), bank account details, and the District Officer&apos;s name. This information is used for auto-generating PDF reports.</li>
                    <li><strong>Register Staff:</strong> Go to the Establishment page and add all employees. Ensure accurate designations and PEN numbers.</li>
                    <li><strong>Create User Accounts:</strong> While adding or editing a staff member, check the &quot;Create User Account&quot; box to provide them with dashboard access (e.g., for Supervisors or Investigators).</li>
                    <li><strong>Log Vehicles & Rigs:</strong> On the Vehicles & Rig page, add details of all department vehicles, hired vehicles, and Rig & Compressor Units belonging to your office. Also, use the &apos;Add External&apos; button to log any rigs engaged from other offices. This ensures all units are available for selection in project forms.</li>
                </ol>
            </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-700"><ShieldCheck className="h-4 w-4"/>Super Admin Functions</CardTitle>
                <CardDescription className="text-amber-600/80">Management of sub-offices and global settings.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-amber-900/80 space-y-3">
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Sub-Office Setup:</strong> Super Admins can create new office locations. This automatically provisions three core accounts: Admin, Scientist, and Engineer with initial credentials.</li>
                    <li><strong>Global Data:</strong> Super Admins manage departmental drilling rates and global user accounts across the entire state.</li>
                    <li><strong>Transfer Approval:</strong> When an Office Admin initiates a staff transfer, it must be approved by the Super Admin to move the record to the target office.</li>
                </ul>
            </CardContent>
        </Card>
      </div>

      {/* 3. Recent Updates Highlight */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-primary"><History className="h-5 w-5" />Recent System Enhancements</CardTitle>
            <CardDescription>Latest updates to improve your workflow and productivity.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary"/>Navigation Address</h4>
                    <p className="text-xs text-muted-foreground">A new breadcrumb trail at the top-left of every page helps you track your current location and navigate back to parent categories with a single click.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm"><Save className="h-4 w-4 text-primary"/>Save vs Close Logic</h4>
                    <p className="text-xs text-muted-foreground">The <strong>Save</strong> button now persists data only, allowing you to continue editing. Use the <strong>Close</strong> button once you are finished to return to the list view.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm"><ExternalLink className="h-4 w-4 text-primary"/>Dashboard Drill-down</h4>
                    <p className="text-xs text-muted-foreground">Clicking a <strong>File No.</strong> in Dashboard popups now opens the record in a <strong>new browser window</strong>, keeping your summary view active in the original tab.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm"><Palette className="h-4 w-4 text-primary"/>Status Color Coding</h4>
                    <p className="text-xs text-muted-foreground">Site names in tables are now color-coded: <span className="text-green-600 font-bold">Green</span> for Ongoing, <span className="text-amber-600 font-bold">Yellow</span> for Refunds, and <span className="text-red-600 font-bold">Red</span> for Completed/Failed.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm"><RefreshCw className="h-4 w-4 text-primary"/>No Horizontal Scrollbars</h4>
                    <p className="text-xs text-muted-foreground">Eliminated unwanted horizontal scrollbars across all pages. Tab lists and table containers now use fluid wrapping and constrained widths for pristine desktop and mobile viewing.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-sm"><FileStack className="h-4 w-4 text-primary"/>Fluid Table Wrapping</h4>
                    <p className="text-xs text-muted-foreground">Table headers and cells now automatically wrap text and break long words (`break-words`), ensuring records fit neatly within the viewport without horizontal overflow.</p>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* 4. Features Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features & Modules</CardTitle>
          <CardDescription>Understanding the specialized sections of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="investigation">
              <AccordionTrigger>GW Investigation & Logging/Pumping Modules</AccordionTrigger>
              <AccordionContent className="space-y-4">
                 <div className="flex gap-4">
                    <div className="shrink-0"><TestTube2 className="h-10 w-10 text-primary" /></div>
                    <div>
                        <h4 className="font-semibold text-foreground">GW Investigation</h4>
                        <p className="text-sm text-muted-foreground">Dedicated to hydrogeological and geophysical surveys. Features include feasibility tracking, recommended well measurements, and investigator assignments.</p>
                    </div>
                 </div>
                 <div className="flex gap-4 pt-2">
                    <div className="shrink-0"><Droplets className="h-10 w-10 text-primary" /></div>
                    <div>
                        <h4 className="font-semibold text-foreground">Logging & Pumping Test</h4>
                        <p className="text-sm text-muted-foreground">Captures technical data for geological/geophysical logging and various pumping tests. Focuses on borehole characteristics and yield analysis.</p>
                    </div>
                 </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="reapp">
              <AccordionTrigger>Re-appropriation & Fund Transfers</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                    This module tracks the movement of funds between files. When funds are moved &quot;Outward&quot; from one file, the system automatically creates a &quot;Credit&quot; entry in the destination file, ensuring a clear audit trail of departmental funds.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="gallery">
              <AccordionTrigger>Image &amp; Video Gallery</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Allows officers and field staff to directly upload site photos and operational videos (under <strong>25 MB</strong> per file) directly from their phone, tablet, or workstation.
                </p>
                <p>
                  All uploaded media is automatically synchronized and stored into the departmental Google Drive (<code>keralagwd@gmail.com</code>), neatly organized under <code>GWD_Site_Media / [District Office] / [File No - Site Name]</code>. Embedded video players and photo galleries provide one-click visual monitoring of drilling, yield testing, and installation works. External links (YouTube, Vimeo, Postimages) also remain supported.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="etender">
              <AccordionTrigger>e-Tender Management</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">A complete lifecycle manager for electronic tenders. It handles fee calculations, bidder ranking (L1 detection), and one-click PDF generation for NIT, Selection Notices, and Work/Supply Orders.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ars">
              <AccordionTrigger>ARS (Artificial Recharge Schemes)</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">A specialized module for check dams, recharge pits, and ponds. Includes bulk Excel import/export capabilities specifically designed for large-scale ARS data sets.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="status-mapping">
              <AccordionTrigger className="font-semibold text-primary">
                Automatic Work Status &amp; File Status Population (e.g. Tendered &rarr; Tender Process)
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  To ensure departmental records remain strictly synchronized across all offices, the dashboard includes an <strong>automated status reconciliation engine</strong>. When you update the <strong>Work Status</strong> of individual sites under a file, the overarching <strong>File Status</strong> is automatically calculated and updated:
                </p>

                <div className="rounded-lg border overflow-hidden my-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 bg-muted/70 font-semibold p-2.5 text-xs text-foreground border-b">
                    <div>Calculated File Status</div>
                    <div>Triggering Site Work Status(es)</div>
                    <div>Lifecycle Description</div>
                  </div>
                  <div className="divide-y text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 items-center gap-1">
                      <span className="font-bold text-blue-700 dark:text-blue-400">Tender Process</span>
                      <span className="font-medium text-foreground">Tendered, Selection Notice Issued, Work Order Issued</span>
                      <span className="text-muted-foreground">
                        Automatically populated when any active site is set to <strong>Tendered</strong> or linked with an e-Tender. The file transitions to the e-Tender lifecycle.
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 p-2.5 items-center gap-1">
                      <span className="font-bold text-amber-700 dark:text-amber-400">File Under Process</span>
                      <span className="font-medium text-foreground">Under Process, TS Pending, Tender Pending, Additional Fund Awaited, Pending, VES Pending</span>
                      <span className="text-muted-foreground">
                        Pre-execution stages including initial hydrogeological feasibility surveys, estimate preparation, and administrative sanctions.
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 p-2.5 items-center gap-1">
                      <span className="font-bold text-purple-700 dark:text-purple-400">Work Initiated</span>
                      <span className="font-medium text-foreground">Work in Progress, Department Rig Allotted, Work Initiated</span>
                      <span className="text-muted-foreground">
                        Triggered when drilling commences, departmental rig is deployed, or on-site physical implementation starts.
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 p-2.5 items-center gap-1">
                      <span className="font-bold text-indigo-700 dark:text-indigo-400">Partially Completed</span>
                      <span className="font-medium text-foreground">Mixed combination of completed and ongoing/pending sites</span>
                      <span className="text-muted-foreground">
                        Automatically assigned when multi-borewell or multi-site files have some sites finished while other sites are still pending or underway.
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 p-2.5 items-center gap-1">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">Fully Completed</span>
                      <span className="font-medium text-foreground">Work Completed (all active sites)</span>
                      <span className="text-muted-foreground">
                        Automatically closes the operational lifecycle once all designated works are successfully completed.
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-md border">
                  <strong>Key Takeaway:</strong> When a site&apos;s status is set to <strong>&quot;Tendered&quot;</strong>, the file automatically updates to <strong>&quot;Tender Process&quot;</strong>. You do not need to manually change both fields; the dashboard maintains cross-module integrity with e-Tender and Progress Reports automatically.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* 5. FAQ & Image Hosting Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions (FAQ)</CardTitle>
          <CardDescription>Quick answers to common procedural questions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-images">
              <AccordionTrigger className="text-primary font-bold">How do I upload photos and videos to the Media Gallery?</AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm text-muted-foreground text-justify">
                <p>
                  Direct device uploads are supported for both site photos and field videos (up to <strong>25 MB</strong> per file). All media is securely synchronized and stored into the department&apos;s centralized Google Drive (<code>keralagwd@gmail.com</code>).
                </p>
                <div className="p-4 rounded-lg bg-secondary/30 border space-y-2.5">
                    <p className="font-semibold text-primary flex items-center gap-2"><ImageUp className="h-4 w-4"/> Recommended Direct Upload Workflow:</p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                        <li>Open the work site record in <strong>Deposit Works</strong>, <strong>Plan Fund</strong>, or <strong>ARS</strong> and navigate to the site&apos;s <strong>Media Gallery</strong>.</li>
                        <li>Click <strong>&quot;Upload Photo&quot;</strong> or <strong>&quot;Upload Video&quot;</strong> and select any file below <strong>25 MB</strong> from your phone, camera, or computer.</li>
                        <li>The dashboard automatically compresses photos for quick loading, encodes videos, and syncs them directly into your district office&apos;s folder.</li>
                        <li>Photos preview instantly and videos play directly within the integrated media viewer.</li>
                    </ol>
                </div>
                <p className="text-xs text-muted-foreground">
                  <em>Note:</em> For staff profile photos, direct uploads from the Establishment form are similarly supported up to 25 MB. Pre-hosted external URLs (such as YouTube/Vimeo embeds or direct image links) continue to be accepted as an alternative.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="faq-1">
              <AccordionTrigger>How are new user accounts created?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Sub-Office Accounts:</strong> Initial Admin, Scientist, and Engineer accounts are created by the Super Admin.</li>
                    <li><strong>Staff Logins:</strong> Office Admins create accounts for other staff (like Supervisors) by registering them in the <strong>Establishment</strong> module and checking the &quot;Create User Account&quot; option.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-icon">
              <AccordionTrigger>What does the &apos;Eye&apos; icon do?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                The &apos;Eye&apos; icon opens a detailed view of the record. In list views, it allows you to see the full information of a file or staff member. In forms, it allows you to edit the specific details of a site or remittance entry.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4">
              <AccordionTrigger>How does the LSG and Constituency mapping work?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Admins can import an Excel mapping file in <strong>Settings</strong>. Once mapped, selecting an LSG in any project form will automatically filter the &quot;Constituency&quot; dropdown to show only the LACs associated with that LSG.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-status-sync">
              <AccordionTrigger>Why does File Status automatically change to &quot;Tender Process&quot;?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  The dashboard maintains cross-system data consistency between project files and the e-Tender module. When you mark any active site&apos;s Work Status as <strong>&quot;Tendered&quot;</strong> (or when an e-Tender is published for that site), the overarching file status automatically changes to <strong>&quot;Tender Process&quot;</strong>.
                </p>
                <p>
                  This automatic synchronization ensures that notice boards, district progress reports, and file tracking lists stay aligned in real-time without requiring duplicate manual edits.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      
      {/* 6. Footer Support */}
      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardHeader>
           <div className="flex items-center space-x-3">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <CardTitle>Contact for Support</CardTitle>
          </div>
          <CardDescription>
            If you encounter technical issues, contact the system administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
           <p className="text-sm">
            <strong>Administrator Contact:</strong> 8547650853
          </p>
           {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Help page last updated: {lastUpdated}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
