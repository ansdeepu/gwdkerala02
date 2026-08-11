"use client";

import React, { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  label?: string;
  placeholder: string;
  options: Option[];
  selectedValues: string[]; // ['all'] or array of values
  onChange: (selected: string[]) => void;
  className?: string;
}

export function MultiSelectFilter({
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isAllSelected = useMemo(() => {
    return !selectedValues || selectedValues.length === 0 || selectedValues.includes("all");
  }, [selectedValues]);

  const activeValues = useMemo(() => {
    if (isAllSelected) return [];
    return selectedValues.filter((v) => v !== "all");
  }, [isAllSelected, selectedValues]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lower = search.toLowerCase();
    return options.filter(
      (opt) => opt.label.toLowerCase().includes(lower) || opt.value.toLowerCase().includes(lower)
    );
  }, [options, search]);

  const toggleOption = (val: string) => {
    if (val === "all") {
      onChange(["all"]);
      return;
    }
    let updated: string[];
    if (activeValues.includes(val)) {
      updated = activeValues.filter((v) => v !== val);
    } else {
      updated = [...activeValues, val];
    }
    if (updated.length === 0 || updated.length === options.length) {
      onChange(["all"]);
    } else {
      onChange(updated);
    }
  };

  const selectAll = () => {
    onChange(["all"]);
  };

  const clearAll = () => {
    onChange(["all"]);
  };

  const displayText = useMemo(() => {
    if (isAllSelected) return placeholder;
    if (activeValues.length === 1) {
      const found = options.find((o) => o.value === activeValues[0]);
      return found ? found.label : activeValues[0];
    }
    return `${activeValues.length} Selected`;
  }, [isAllSelected, activeValues, options, placeholder]);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label className="text-xs font-semibold">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-9 w-full justify-between px-3 text-left font-normal bg-background hover:bg-accent/50 text-xs transition-colors",
              !isAllSelected && "border-primary/60 bg-primary/5 text-primary font-medium"
            )}
          >
            <span className="truncate mr-1">{displayText}</span>
            <div className="flex items-center gap-1 shrink-0">
              {!isAllSelected && (
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAll();
                  }}
                >
                  {activeValues.length}
                  <X className="ml-1 h-3 w-3 hover:text-destructive" />
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-2 space-y-2 shadow-lg" align="start">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={`Search ${label || "options"}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="flex items-center justify-between px-1 py-1 text-xs border-b">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
              onClick={selectAll}
            >
              Select All (Reset)
            </Button>
            <span className="text-[11px] text-muted-foreground">
              {isAllSelected ? "All selected" : `${activeValues.length} of ${options.length}`}
            </span>
          </div>

          <ScrollArea className="h-52 pr-2">
            <div className="space-y-1 p-0.5">
              <div
                className={cn(
                  "flex items-center space-x-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer text-xs transition-colors",
                  isAllSelected && "bg-accent/80 font-medium"
                )}
                onClick={() => toggleOption("all")}
              >
                <Checkbox id={`${label}-all`} checked={isAllSelected} onCheckedChange={() => toggleOption("all")} />
                <Label htmlFor={`${label}-all`} className="cursor-pointer text-xs flex-1">
                  All {label || "Options"}
                </Label>
              </div>

              {filteredOptions.map((opt) => {
                const checked = activeValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    className={cn(
                      "flex items-center space-x-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer text-xs transition-colors",
                      checked && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => toggleOption(opt.value)}
                  >
                    <Checkbox
                      id={`${label}-${opt.value}`}
                      checked={checked}
                      onCheckedChange={() => toggleOption(opt.value)}
                    />
                    <Label htmlFor={`${label}-${opt.value}`} className="cursor-pointer text-xs flex-1 truncate">
                      {opt.label}
                    </Label>
                  </div>
                );
              })}
              {filteredOptions.length === 0 && (
                <p className="p-2 text-xs text-muted-foreground text-center">No options found</p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
