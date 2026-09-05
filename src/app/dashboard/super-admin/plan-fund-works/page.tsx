// src/app/dashboard/super-admin/plan-fund-works/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/plan-fund-works');
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

