"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 
  | 'completed' 
  | 'pending' 
  | 'in_progress' 
  | 'cancelled' 
  | 'failed' 
  | 'active' 
  | 'draft'
  | 'approved'
  | 'rejected'
  | string;

interface StatusChipProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: StatusType | null;
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, label, size = 'md', className, ...props }: StatusChipProps) {
  const displayLabel = label || status || 'N/A';
  const normStatus = (status || label || '').toLowerCase().trim();

  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  let dotClass = 'bg-slate-400';

  if (
    normStatus.includes('completed') || 
    normStatus.includes('approved') || 
    normStatus.includes('registered') || 
    normStatus.includes('active') ||
    normStatus === 'verified'
  ) {
    styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60';
    dotClass = 'bg-emerald-500';
  } else if (
    normStatus.includes('pending') || 
    normStatus.includes('draft') || 
    normStatus.includes('tendered') ||
    normStatus.includes('inspection')
  ) {
    styleClasses = 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60';
    dotClass = 'bg-amber-500';
  } else if (
    normStatus.includes('progress') || 
    normStatus.includes('ongoing') || 
    normStatus.includes('awarded') ||
    normStatus.includes('processing')
  ) {
    styleClasses = 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60';
    dotClass = 'bg-sky-500';
  } else if (
    normStatus.includes('cancel') || 
    normStatus.includes('fail') || 
    normStatus.includes('reject') || 
    normStatus.includes('expired')
  ) {
    styleClasses = 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60';
    dotClass = 'bg-rose-500';
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-medium tracking-tight whitespace-nowrap transition-colors",
        size === 'sm' ? "px-2 py-0.5 text-[11px] gap-1" : "px-2.5 py-0.5 text-xs gap-1.5",
        styleClasses,
        className
      )}
      {...props}
    >
      <span className={cn("rounded-full shrink-0", size === 'sm' ? "h-1.5 w-1.5" : "h-2 w-2", dotClass)} />
      <span>{displayLabel}</span>
    </div>
  );
}
