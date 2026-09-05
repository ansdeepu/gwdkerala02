"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Pass through Next.js navigation redirect errors
  if (error?.message === 'NEXT_REDIRECT' || error?.digest?.includes('NEXT_REDIRECT')) {
    throw error;
  }

  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4 font-sans text-center">
      <div className="max-w-md space-y-6 bg-card p-8 rounded-xl shadow-2xl border border-border/40">
        <Image
          src="/gwd-logo.svg"
          alt="GWD Logo"
          width={80}
          height={80}
          className="mx-auto object-contain"
          referrerPolicy="no-referrer"
          priority
        />
        <h1 className="text-3xl font-extrabold tracking-tight text-destructive">Something went wrong!</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Please try refreshing or resetting the application.
        </p>
        <div className="flex gap-4 pt-2">
          <Button onClick={() => reset()} className="flex-1">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/dashboard"} className="flex-1">
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
