"use client";

import React, { useState, useEffect } from "react";
import { TOP_KERALA_BANKS, OTHER_KERALA_BANKS, ALL_KERALA_BANKS } from "@/lib/constants/banks";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface BankSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
}

const OTHER_VALUE = "__OTHER__";

export const BankSelect: React.FC<BankSelectProps> = ({
  value = "",
  onChange,
  disabled = false,
  id = "bankName",
  placeholder = "Select Bank",
  className,
}) => {
  const currentValue = value || "";
  
  // Check if current value matches any bank in the list exactly
  const isKnownBank = ALL_KERALA_BANKS.includes(currentValue as any);
  const isOther = !isKnownBank && currentValue.trim().length > 0;

  const [selectedKey, setSelectedKey] = useState<string>(() => {
    if (isKnownBank) return currentValue;
    if (isOther) return OTHER_VALUE;
    return "";
  });

  const [customBank, setCustomBank] = useState<string>(() => {
    return isOther ? currentValue : "";
  });

  useEffect(() => {
    if (isKnownBank) {
      setSelectedKey(currentValue);
    } else if (currentValue.trim().length > 0) {
      setSelectedKey(OTHER_VALUE);
      setCustomBank(currentValue);
    } else {
      setSelectedKey("");
      setCustomBank("");
    }
  }, [currentValue, isKnownBank]);

  const handleSelectChange = (val: string) => {
    setSelectedKey(val);
    if (val === OTHER_VALUE) {
      onChange(customBank);
    } else {
      onChange(val);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomBank(val);
    onChange(val);
  };

  return (
    <div className="space-y-2">
      <Select
        value={selectedKey}
        onValueChange={handleSelectChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <SelectGroup>
            <SelectLabel className="text-xs font-bold text-primary tracking-wider uppercase">
              Top Banks in Kerala
            </SelectLabel>
            {TOP_KERALA_BANKS.map((bank) => (
              <SelectItem key={bank} value={bank} className="font-medium">
                {bank}
              </SelectItem>
            ))}
          </SelectGroup>

          <SelectSeparator className="my-1" />

          <SelectGroup>
            <SelectLabel className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
              Other Banks & Financial Institutions
            </SelectLabel>
            {OTHER_KERALA_BANKS.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectGroup>

          <SelectSeparator className="my-1" />

          <SelectGroup>
            <SelectItem value={OTHER_VALUE} className="text-primary font-semibold">
              + Other (Specify Manually)
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {selectedKey === OTHER_VALUE && (
        <Input
          placeholder="Enter Bank / Co-operative Society name..."
          value={customBank}
          onChange={handleCustomInputChange}
          disabled={disabled}
          autoFocus
          className="mt-1.5"
        />
      )}
    </div>
  );
};
