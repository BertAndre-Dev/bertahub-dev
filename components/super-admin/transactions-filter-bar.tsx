"use client";

import React, { useEffect, useRef } from "react";
import { DateRangeFilter } from "@/components/ui/date-range-filter";

function toIsoDateUTC(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function getLastNDaysRangeIsoUTC(days: number): {
  fromDate: string;
  toDate: string;
} {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - days);
  return { fromDate: toIsoDateUTC(from), toDate: toIsoDateUTC(to) };
}

interface TransactionsFilterBarProps {
  fromDate: string | null;
  toDate: string | null;
  estate: string;
  type: string;
  onFiltersChange: (filters: {
    fromDate: string | null;
    toDate: string | null;
    estate: string;
    type: string;
  }) => void;
  onExport?: (format: "csv" | "pdf") => void;
  /** Placeholder for the text search input (e.g. "Filter by name", "Filter by estate name"). Default: "Filter by estate name" */
  searchPlaceholder?: string;
  /** Label shown before the search input (e.g. "Name", "Estate"). Default: "Estate" */
  searchFieldLabel?: string;
  /** Whether to show the Type (credit/debit) filter. Default: true */
  showTypeFilter?: boolean;
  /** Whether to show the text search/estate input. Default: true */
  showSearchInput?: boolean;
  /**
   * Auto-initialize the date range when empty.
   * Default: 0 (disabled). Set to a positive number for last-N-days on load.
   */
  defaultDateRangeDays?: number;
}

export const TransactionsFilterBar: React.FC<TransactionsFilterBarProps> = ({
  fromDate,
  toDate,
  estate,
  type,
  onFiltersChange,
  onExport,
  searchPlaceholder = "Filter by estate name",
  searchFieldLabel = "Estate",
  showTypeFilter = true,
  showSearchInput = true,
  defaultDateRangeDays = 0,
}) => {
  const hasInitializedDefaultRange = useRef(false);

  useEffect(() => {
    if (!defaultDateRangeDays) return;
    if (hasInitializedDefaultRange.current) return;
    if (fromDate || toDate) return;

    hasInitializedDefaultRange.current = true;
    const range = getLastNDaysRangeIsoUTC(defaultDateRangeDays);
    onFiltersChange({
      fromDate: range.fromDate,
      toDate: range.toDate,
      estate,
      type,
    });
  }, [defaultDateRangeDays, fromDate, toDate, onFiltersChange, estate, type]);

  const handleFromDateChange = (iso: string) => {
    onFiltersChange({
      fromDate: iso || null,
      toDate,
      estate,
      type,
    });
  };

  const handleToDateChange = (iso: string) => {
    onFiltersChange({
      fromDate,
      toDate: iso || null,
      estate,
      type,
    });
  };

  const handleEstateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      fromDate,
      toDate,
      estate: e.target.value,
      type,
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      fromDate,
      toDate,
      estate,
      type: e.target.value,
    });
  };

  const handleExportClick = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onExport) return;
    const value = e.target.value as "csv" | "pdf" | "";
    if (!value) return;
    onExport(value);
  };

  return (
    <div className="w-full flex flex-col gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <DateRangeFilter
        startDate={fromDate ?? ""}
        endDate={toDate ?? ""}
        onStartChange={handleFromDateChange}
        onEndChange={handleToDateChange}
        startPlaceholder={defaultDateRangeDays ? "" : undefined}
        endPlaceholder={defaultDateRangeDays ? "" : undefined}
      />

      <div className="flex items-center gap-2 pt-4">
        {showSearchInput && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{searchFieldLabel}:</span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={estate}
              onChange={handleEstateChange}
              className="px-3 py-2 border rounded-lg text-sm min-w-[200px]"
            />
          </div>
        )}

        {showTypeFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Type:</span>
            <select
              aria-label="Select type"
              value={type}
              onChange={handleTypeChange}
              className="px-3 py-2 border rounded-lg text-sm min-w-[160px] bg-white cursor-pointer"
            >
              <option value="">All</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Export:</span>
          <select
            defaultValue=""
            onChange={handleExportClick}
            className="px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer"
            aria-label="Select export format"
          >
            <option value="">Select format</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
      </div>
    </div>
  );
};
