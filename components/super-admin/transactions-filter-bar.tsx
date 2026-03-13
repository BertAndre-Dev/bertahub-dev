import React from "react";

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
}) => {
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      fromDate: e.target.value || null,
      toDate,
      estate,
      type,
    });
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      fromDate,
      toDate: e.target.value || null,
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
    <div className="bg-white p-4 rounded-lg border flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <span role="img" aria-label="calendar" >
          📅
        </span>
        <input
          title="From Date"
          placeholder="From Date"
          type="date"
          value={fromDate ?? ""}
          onChange={handleFromDateChange}
          className="px-3 py-2 border rounded-lg text-sm cursor-pointer"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <input
          title="To Date"
          placeholder="To Date"
          type="date"
          value={toDate ?? ""}
          onChange={handleToDateChange}
          className="px-3 py-2 border rounded-lg text-sm cursor-pointer"
        />
      </div>

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
  );
};

