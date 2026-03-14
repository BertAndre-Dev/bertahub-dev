"use client";

import React from "react";

export interface EstateTransactionsFilters {
  frequency: string;
  bill: string;
  status: string;
}

interface TransactionsFilterBarProps {
  frequency: string;
  bill: string;
  status: string;
  onFiltersChange: (filters: EstateTransactionsFilters) => void;
  /** Unique frequency options (e.g. from paid bills data). Include "All" via empty string in options. */
  frequencyOptions?: { value: string; label: string }[];
  /** Unique bill name options (e.g. from paid bills data). Include "All" via empty string. */
  billOptions?: { value: string; label: string }[];
  /** Whether to show the filter bar (e.g. only on Paid Bills tab). Default true. */
  visible?: boolean;
}

const DEFAULT_FREQUENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const DEFAULT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
];

export const TransactionsFilterBar: React.FC<TransactionsFilterBarProps> = ({
  frequency,
  bill,
  status,
  onFiltersChange,
  frequencyOptions = DEFAULT_FREQUENCY_OPTIONS,
  billOptions = [{ value: "", label: "All" }],
  visible = true,
}) => {
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      frequency: e.target.value,
      bill,
      status,
    });
  };

  const handleBillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      frequency,
      bill: e.target.value,
      status,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      frequency,
      bill,
      status: e.target.value,
    });
  };

  if (!visible) return null;

  return (
    <div className="bg-white p-4 rounded-lg border flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Frequency:
        </span>
        <select
          aria-label="Filter by frequency"
          value={frequency}
          onChange={handleFrequencyChange}
          className="px-3 py-2 border border-border rounded-lg text-sm min-w-[140px] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {frequencyOptions.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Bill:
        </span>
        <select
          aria-label="Filter by bill"
          value={bill}
          onChange={handleBillChange}
          className="px-3 py-2 border border-border rounded-lg text-sm min-w-[160px] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {billOptions.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Status:
        </span>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={handleStatusChange}
          className="px-3 py-2 border border-border rounded-lg text-sm min-w-[140px] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {DEFAULT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
