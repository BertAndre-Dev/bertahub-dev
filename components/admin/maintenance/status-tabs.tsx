"use client";

import { cn } from "@/lib/utils";

export const MAINTENANCE_STATUSES = [
  { value: "all", label: "All" },
  { value: "in progress", label: "In progress" },
  { value: "in review", label: "In review" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
  { value: "assigned", label: "Assigned" },
] as const;

export type MaintenanceStatusValue =
  (typeof MAINTENANCE_STATUSES)[number]["value"];

interface StatusTabsProps {
  value: MaintenanceStatusValue | string;
  onChange: (value: MaintenanceStatusValue) => void;
  className?: string;
}

export function StatusTabs({ value, onChange, className }: StatusTabsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 border-b border-border pb-2",
        className
      )}
    >
      {MAINTENANCE_STATUSES.map((tab) => {
        const isActive =
          value === tab.value ||
          (value === "" && tab.value === "all");
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value as MaintenanceStatusValue)}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-t transition-colors",
              isActive
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
