
// src/app/login/page.tsx
"use client";

import LoginForm from "@/components/auth/LoginForm";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SUPER_ADMIN_EMAIL } from "@/lib/config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, Building2, Lock, CheckCircle2 } from "lucide-react";

const Loader2 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [modalType, setModalType] = useState<"privacy" | "terms" | null>(null);

  useEffect(() => {
    // If the authentication state is resolved and the user is authenticated, redirect.
    if (!isLoading && isAuthenticated && user) {
      if (user.email === SUPER_ADMIN_EMAIL) {
        router.replace('/dashboard/super-admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  // Show a loading screen only while the initial check is happening.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Render the login form if not loading and not yet authenticated.
  // The useEffect above will handle redirecting authenticated users.
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4 font-sans">
      <div className="flex-1 flex items-center justify-center w-full my-8">
        <div className="flex w-full max-w-4xl flex-col items-center space-y-8 rounded-xl bg-card p-8 shadow-2xl md:flex-row md:space-y-0 md:space-x-10 md:p-12">
          {/* Left Column: Branding */}
          <div className="flex w-full flex-col items-center text-center md:w-1/2">
            <Image
              src="/gwd-logo.svg"
              alt="GWD Logo"
              width={100}
              height={100}
              className="mb-6 object-contain"
              referrerPolicy="no-referrer"
              priority
            />
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-primary md:text-4xl">
              GWD Dashboard
            </h1>
            <p className="mb-6 text-muted-foreground md:text-lg">
              Efficiently manage and monitor ground water resources.
            </p>
            <p className="text-xs text-muted-foreground">
              Access requires an authorized account.
            </p>
          </div>
          {/* Right Column: Login Form */}
          <div className="w-full md:w-1/2">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl py-6 mt-auto border-t border-border/40 text-center text-xs text-muted-foreground flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="whitespace-nowrap">
          © 2026 Ground Water Department, Government of Keralam. All rights reserved.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setModalType("privacy")}
            className="hover:text-primary transition-colors cursor-pointer focus:outline-none underline-offset-4 hover:underline"
          >
            Privacy Policy
          </button>
          <span className="text-muted-foreground/35 select-none">•</span>
          <button
            type="button"
            onClick={() => setModalType("terms")}
            className="hover:text-primary transition-colors cursor-pointer focus:outline-none underline-offset-4 hover:underline"
          >
            Terms of Service
          </button>
          <span className="text-muted-foreground/35 select-none">•</span>
          <span className="hover:text-primary transition-colors">Technical Support: 8547650853</span>
        </div>
      </footer>

      {/* Privacy Policy Dialog */}
      <Dialog open={modalType === "privacy"} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Privacy Policy</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ground Water Department, Government of Keralam
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 overflow-y-auto space-y-4 text-sm text-foreground/90 leading-relaxed max-h-[60vh]">
            <section className="space-y-2">
              <h3 className="font-semibold text-primary flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> 1. Information Collection & Purpose
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                The Ground Water Department (GWD) Web Portal collects official departmental data, including user credentials, staff authorizations, site location details, groundwater investigation records, drilling data, and deposit work financial records solely for official groundwater administration, resource monitoring, and departmental accounting.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-primary flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" /> 2. Data Protection & Security
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                All records, user data, and financial transactions are protected in accordance with the Information Technology Act, 2000, and Kerala State IT Security Guidelines. Role-based access control (RBAC) is strictly enforced to ensure that only authorized personnel can access sensitive departmental records.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-primary flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4" /> 3. Data Usage & Confidentiality
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Data collected within the application will not be sold, rented, or distributed to any third party or commercial entity. Data may only be shared with authorized governmental agencies, statutory authorities, or audit committees as mandated by Government orders or legal obligations.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-primary flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" /> 4. Contact & Nodal Office
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                For questions regarding data governance or system access, please contact the Directorate of Ground Water Department, Jalavijnana Bhavan, Ambalamukku, Thiruvananthapuram, Keralam.
              </p>
            </section>
          </div>

          <DialogFooter className="p-4 border-t border-border/40 bg-muted/20">
            <Button onClick={() => setModalType(null)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={modalType === "terms"} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Terms of Service</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ground Water Department, Government of Keralam
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 overflow-y-auto space-y-4 text-sm text-foreground/90 leading-relaxed max-h-[60vh]">
            <section className="space-y-2">
              <h3 className="font-semibold text-primary flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> 1. Authorized Government Use Only
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                This system is the official web portal of the Ground Water Department, Government of Keralam. Access is restricted exclusively to authorized officers, staff, and registered administrative personnel. Any unauthorized access, misuse, or tampering with data is strictly prohibited and subject to legal prosecution.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-primary flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" /> 2. Account Responsibility & Credentials
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Authorized users must maintain the confidentiality of their login credentials. Users are held fully accountable for all entries, modifications, approvals, and report generations performed under their account. Sharing credentials with unauthorized individuals is a violation of service terms.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-primary flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4" /> 3. Data Integrity & Official Records
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                All data entered into the system—including investigation logs, pumping tests, drilling completion details, and financial payments—must be authentic and verified against official file documents. Falsification or unauthorized alteration of records is strictly forbidden.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-primary flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" /> 4. Jurisdiction & Governing Law
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws of the State of Keralam and the Republic of India. Any disputes arising out of the use of this portal shall be subject to the exclusive jurisdiction of the competent courts in Kerala / Keralam.
              </p>
            </section>
          </div>

          <DialogFooter className="p-4 border-t border-border/40 bg-muted/20">
            <Button onClick={() => setModalType(null)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
