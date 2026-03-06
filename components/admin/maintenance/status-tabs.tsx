"use client";

import React from "react";
import { cn } from "@/lib/utils";

/** API only accepts: pending, in progress, completed, blocked */
export const MAINTENANCE_STATUSES = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
] as const;

export type MaintenanceStatusValue = (typeof MAINTENANCE_STATUSES)[number]["value"];

const TAB_CLASSES: Record<string, string> = {
  pending: "bg-blue-400 text-white",
  "in progress": "bg-orange-500/90 text-white",
  completed: "bg-green-500 text-white",
  blocked: "bg-gray-500 text-white",
};

interface StatusTabsProps {
  value: MaintenanceStatusValue;
  onChange: (value: MaintenanceStatusValue) => void;
  className?: string;
}

export function StatusTabs({ value, onChange, className }: StatusTabsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-border pb-4",
        className
      )}
    >
      {MAINTENANCE_STATUSES.map((tab) => {
        const isAll = tab.value === "all";
        const isSelected = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors",
              isAll
                ? "text-primary border-b-2 border-primary rounded-none rounded-t pb-2 -mb-0.5"
                : "border border-transparent",
              !isAll && isSelected && TAB_CLASSES[tab.value],
              !isAll && !isSelected && "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
