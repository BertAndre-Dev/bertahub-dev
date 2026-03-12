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
}

export const TransactionsFilterBar: React.FC<TransactionsFilterBarProps> = ({
  fromDate,
  toDate,
  estate,
  type,
  onFiltersChange,
  onExport,
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
        <span role="img" aria-label="calendar" className="cursor-pointer">
          📅
        </span>
        <input
          title="From Date"
          placeholder="From Date"
          type="date"
          value={fromDate ?? ""}
          onChange={handleFromDateChange}
          className="px-3 py-2 border rounded-lg text-sm"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <input
          title="To Date"
          placeholder="To Date"
          type="date"
          value={toDate ?? ""}
          onChange={handleToDateChange}
          className="px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Estate:</span>
        <input
          type="text"
          placeholder="Filter by estate name"
          value={estate}
          onChange={handleEstateChange}
          className="px-3 py-2 border rounded-lg text-sm min-w-[200px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Type:</span>
        <select
          aria-label="Select type"
          value={type}
          onChange={handleTypeChange}
          className="px-3 py-2 border rounded-lg text-sm min-w-[160px] bg-white"
        >
          <option value="">All</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
      </div>

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

