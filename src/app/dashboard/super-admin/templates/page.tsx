"use client";

import React, { useEffect } from "react";
import { SuperAdminTemplateManager } from "@/components/super-admin/SuperAdminTemplateManager";
import { usePageHeader } from "@/hooks/usePageHeader";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MasterPdfTemplatesPage() {
  const { setHeader } = usePageHeader();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    setHeader("Master PDF Template Manager", "Upload & govern official 5-page PDF templates across all sub-offices");
  }, [setHeader]);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const isSuperAdmin = user?.role === "superAdmin" || user?.email === "keralagwd@gmail.com";

  if (!isSuperAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-4">
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-6 text-center space-y-4">
            <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
            <h2 className="text-xl font-bold text-red-900 dark:text-red-300">Access Restricted</h2>
            <p className="text-sm text-red-700 dark:text-red-400">
              Only the Super Admin has permission to manage and upload master PDF templates for the Kerala Ground Water Department.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <SuperAdminTemplateManager />;
}
