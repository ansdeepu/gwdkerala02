// src/components/shared/FormBudgetSummaryBar.tsx
"use client";

import React from 'react';
import { TrendingUp, TrendingDown, Wallet, FileText, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FormBudgetSummaryBarProps {
  totalRemitted?: number;
  totalSanctioned?: number;
  remittanceTotal?: number;
  totalCredit?: number;
  totalExpenditure?: number;
  expenditureTotal?: number;
  totalDebit?: number;
  netBalance?: number;
  balance?: number;
  fileNo?: string;
  applicantName?: string;
  className?: string;
  compact?: boolean;
}

export function FormBudgetSummaryBar({
  totalRemitted,
  totalSanctioned,
  remittanceTotal,
  totalCredit,
  totalExpenditure,
  expenditureTotal,
  totalDebit,
  netBalance,
  balance,
  fileNo,
  applicantName,
  className = "",
  compact = false
}: FormBudgetSummaryBarProps) {
  const remitted = totalRemitted ?? totalSanctioned ?? remittanceTotal ?? totalCredit ?? 0;
  const expenditure = totalExpenditure ?? expenditureTotal ?? totalDebit ?? 0;
  const computedBalance = netBalance ?? balance ?? (remitted - expenditure);

  const isDeficit = computedBalance < 0;

  return (
    <div className={cn(
      "sticky top-0 z-20 w-full p-3 bg-card/95 backdrop-blur-sm border-b border-border/70 shadow-2xs transition-all",
      compact ? "py-2 text-xs" : "py-3",
      className
    )}>
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
        {(fileNo || applicantName) && (
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="truncate">
              {fileNo && <span className="font-mono font-bold text-foreground mr-2">{fileNo}</span>}
              {applicantName && <span className="text-muted-foreground text-xs truncate hidden sm:inline">{applicantName}</span>}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 md:gap-6 ml-auto">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs text-muted-foreground">Sanction / Remittance:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              ₹{remitted.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
            <span className="text-xs text-muted-foreground">Expenditure:</span>
            <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm">
              ₹{expenditure.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Wallet className={cn("h-4 w-4 shrink-0", isDeficit ? "text-red-600" : "text-blue-600")} />
            <span className="text-xs text-muted-foreground">Balance:</span>
            <span className={cn(
              "font-mono font-bold text-sm",
              isDeficit ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
            )}>
              ₹{computedBalance.toLocaleString('en-IN')}
            </span>
            {isDeficit && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0 gap-1">
                <AlertCircle className="h-3 w-3" /> Deficit
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormBudgetSummaryBar;
