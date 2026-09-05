// src/app/dashboard/super-admin/progress-reports/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminProgressReportsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/progress-report');
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

