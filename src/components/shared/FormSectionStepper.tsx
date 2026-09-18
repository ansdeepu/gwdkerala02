// src/components/shared/FormSectionStepper.tsx
"use client";

import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
  id: string | number;
  label: string;
  icon?: React.ReactNode;
  completed?: boolean;
  hasError?: boolean;
  hasErrors?: boolean;
  description?: string;
}

export interface FormSectionStepperProps {
  steps?: StepItem[];
  sections?: StepItem[];
  items?: StepItem[];
  currentStep?: string | number;
  activeStep?: string | number;
  activeSection?: string | number;
  onStepChange?: (stepId: any) => void;
  onStepClick?: (stepId: any) => void;
  onSectionSelect?: (sectionId: any) => void;
  onChange?: (stepId: any) => void;
  className?: string;
}

export function FormSectionStepper({
  steps,
  sections,
  items,
  currentStep,
  activeStep,
  activeSection,
  onStepChange,
  onStepClick,
  onSectionSelect,
  onChange,
  className = ""
}: FormSectionStepperProps) {
  const stepList = steps ?? sections ?? items ?? [
    { id: 'basic', label: 'Basic Info' },
    { id: 'sites', label: 'Site Details' },
    { id: 'remittance', label: 'Remittance' },
    { id: 'payment', label: 'Expenditure' },
    { id: 'verification', label: 'Verification' }
  ];

  const activeId = activeSection ?? activeStep ?? currentStep ?? stepList[0]?.id;

  const handleSelect = (id: string | number) => {
    if (onStepChange) onStepChange(id);
    else if (onStepClick) onStepClick(id);
    else if (onSectionSelect) onSectionSelect(id);
    else if (onChange) onChange(id);
  };

  return (
    <div className={cn("w-full overflow-x-auto pb-2 scrollbar-none", className)}>
      <div className="flex items-center gap-2 min-w-max p-1 bg-muted/40 rounded-lg border border-border/50">
        {stepList.map((step, idx) => {
          const isActive = String(step.id) === String(activeId);
          const hasErr = step.hasError || step.hasErrors;

          return (
            <button
              key={String(step.id)}
              type="button"
              onClick={() => handleSelect(step.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                isActive
                  ? "bg-background text-primary shadow-xs font-semibold border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                hasErr && "text-red-600 dark:text-red-400"
              )}
            >
              <span className={cn(
                "flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                step.completed && !isActive && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                hasErr && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
              )}>
                {step.completed && !isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : hasErr ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  idx + 1
                )}
              </span>

              <span>{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FormSectionStepper;
