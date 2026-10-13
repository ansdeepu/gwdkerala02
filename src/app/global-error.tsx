"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
    const msg = error?.message || "";
    if (error?.name === "ChunkLoadError" || msg.includes("Loading chunk") || msg.includes("failed to load chunk")) {
      const key = "chunk_reload_" + (typeof window !== "undefined" ? window.location.pathname : "");
      const last = sessionStorage.getItem(key);
      const now = Date.now();
      if (!last || now - parseInt(last, 10) > 8000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background" suppressHydrationWarning>
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
            <h1 className="text-3xl font-extrabold tracking-tight text-destructive">
              Something went wrong!
            </h1>
            <p className="text-sm text-muted-foreground">
              An unexpected critical error occurred. Please try refreshing or resetting the application.
            </p>
            <div className="flex gap-4 pt-2">
              <Button onClick={() => reset()} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/dashboard";
                  }
                }}
                className="flex-1"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
