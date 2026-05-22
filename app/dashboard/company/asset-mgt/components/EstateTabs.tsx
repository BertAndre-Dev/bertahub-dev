"use client";

import type { EstateOption } from "../../asset/lib/estate";

type EstateTabsProps = {
  estates: EstateOption[];
  selectedEstateId: string;
  onEstateChange: (estateId: string) => void;
};

export default function EstateTabs({
  estates,
  selectedEstateId,
  onEstateChange,
}: EstateTabsProps) {
  if (!estates.length) return null;

  return (
    <div
      role="tablist"
      aria-label="Select estate"
      className="flex gap-2 overflow-x-auto border-y border-border bg-muted/30"
    >
      {estates.map((estate) => {
        const isActive = selectedEstateId === estate.id;
        return (
          <button
            key={estate.id}
            type="button"
            role="tab"
            data-state={isActive ? "active" : "inactive"}
            onClick={() => onEstateChange(estate.id)}
            className={`cursor-pointer whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {estate.name}
          </button>
        );
      })}
    </div>
  );
}
