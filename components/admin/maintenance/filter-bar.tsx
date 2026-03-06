"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const CATEGORY_OPTIONS = [
  { value: "", label: "Filter by Category" },
  { value: "ELECTRICITY ISSUE", label: "Electricity" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "STRUCTURAL", label: "Structural" },
  { value: "SECURITY", label: "Security" },
  { value: "OTHER", label: "Other" },
];

export const PRIORITY_OPTIONS = [
  { value: "", label: "Filter by Priority" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

interface FilterBarProps {
  readonly priority: string;
  readonly category: string;
  readonly search: string;
  readonly onPriorityChange: (value: string) => void;
  readonly onCategoryChange: (value: string) => void;
  readonly onSearchChange: (value: string) => void;
  readonly className?: string;
}

export function FilterBar({
  priority,
  category,
  search,
  onPriorityChange,
  onCategoryChange,
  onSearchChange,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-muted/20",
        className,
      )}
    >
      <div className="flex gap-2 min-w-[360px]">
        <div className="relative min-w-[180px]">
          <Select
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="pr-8 appearance-none"
          />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        <div className="relative min-w-[180px]">
          <Select
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="pr-8 appearance-none"
          />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 min-w-[200px] max-w-sm">
        <Label className="sr-only">Search by ticket number</Label>
        <Input
          type="text"
          placeholder="Search by ticket number"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9"
        />
      </div>
    </div>
  );
}
