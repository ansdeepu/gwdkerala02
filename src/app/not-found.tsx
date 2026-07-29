"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
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
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">404</h1>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Page Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Button asChild className="w-full">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
