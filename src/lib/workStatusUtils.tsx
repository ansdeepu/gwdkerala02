import React from 'react';
import { cn } from './utils';

/**
 * Returns the CSS classes for work status pill badge chips based on the user specification:
 * - Completed / Bill Prepared / UC Issued: Emerald Green Badge (bg-emerald-100 text-emerald-800 border-emerald-300)
 * - Under Process / Pending: Warm Amber Badge (bg-amber-50 text-amber-800 border-amber-200)
 * - Work Failed: Rose Red Badge (bg-rose-100 text-rose-800 border-rose-300)
 * - Work Cancelled: Gray Badge (bg-gray-200 text-gray-600 border-gray-300)
 */
export const getWorkStatusBadgeClasses = (status?: string | null): string => {
  if (!status) {
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }

  const sLower = String(status).toLowerCase().trim();

  // 1. Work Cancelled: Gray Badge
  if (sLower === 'work cancelled' || sLower.includes('cancel') || sLower.includes('dropped')) {
    return 'bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }

  // 2. Work Failed: Rose Red Badge
  if (
    sLower === 'work failed' || 
    sLower.includes('fail') || 
    sLower.includes('non-feasible') || 
    sLower.includes('not feasible') ||
    sLower.includes('disputed')
  ) {
    return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
  }

  // 3. Completed / Bill Prepared / UC Issued: Emerald Green Badge
  if (
    sLower.includes('completed') ||
    sLower.includes('bill prepared') ||
    sLower.includes('uc issued') ||
    sLower.includes('utilization certificate') ||
    sLower.includes('payment completed') ||
    sLower.includes('feasible') ||
    sLower.includes('success')
  ) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
  }

  // 4. Under Process / Pending (and all other active/in-progress statuses): Warm Amber Badge
  return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
};

/**
 * Returns the CSS text color class for site name in a file based on work status:
 * - Work Completed or Work Failed: Red
 * - Work Cancelled: Grey
 * - Refund Pending: Yellow
 * - All other work status: Green
 */
export const getSiteNameStatusColorClass = (status?: string | null): string => {
  if (!status) return 'text-green-600 dark:text-green-400';
  const sLower = String(status).toLowerCase().trim();

  // Work Cancelled: Grey (text-gray-500 dark:text-gray-400)
  if (sLower === 'work cancelled' || sLower.includes('cancel') || sLower.includes('dropped')) {
    return 'text-gray-500 dark:text-gray-400 line-through';
  }

  // Work Completed or Work Failed: Red (text-red-600 dark:text-red-400)
  if (
    sLower === 'work completed' ||
    sLower === 'completed' ||
    sLower === 'work failed' ||
    sLower.includes('fail')
  ) {
    return 'text-red-600 dark:text-red-400';
  }

  // Refund Pending: Yellow
  if (sLower === 'refund pending' || sLower.includes('refund') || sLower === 'to be refunded') {
    return 'text-yellow-600 dark:text-yellow-400';
  }

  // Green (text-green-600 dark:text-green-400): For all other work statuses
  return 'text-green-600 dark:text-green-400';
};

/**
 * Renders a distinct Pill Badge chip with rounded borders and background tints
 */
export const renderWorkStatusPillBadge = (status?: string | null, className?: string): React.ReactNode => {
  if (!status) return null;
  const badgeClasses = getWorkStatusBadgeClasses(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors shadow-xs",
        badgeClasses,
        className
      )}
    >
      {status}
    </span>
  );
};
