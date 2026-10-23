"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { DateRangeFilter } from "@/components/ui/date-range-filter";

export interface ReportTableRow {
  key: string;
  label: string;
  amount: number;
  href?: string;
}

export interface ReportTableSummaryRow {
  label: string;
  amount: number;
  colorClass: string;
}

export interface ReportTableFilterOption {
  label: string;
  value: string;
}

export interface ReportTableProps {
  columnLabel: string;
  rows: ReportTableRow[];
  summaryRows: ReportTableSummaryRow[];
  filterLabel: string;
  filterOptions: ReportTableFilterOption[];
  filterValue: string;
  onFilterChange: (value: string) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
  showDateRange?: boolean;
  exportFileName?: string;
}

function formatNaira(n: number): string {
  return `₦${Number(n ?? 0).toLocaleString()}`;
}

function csvEscape(value: string | number): string {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n"))
    return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export function ReportTable({
  columnLabel,
  rows,
  summaryRows,
  onFilterChange,
  startDate,
  endDate,
  onDateRangeChange,
  showDateRange = true,
  exportFileName = "report",
}: ReportTableProps) {
  const router = useRouter();
  function handleExport() {
    if (!rows.length) return;

    const headers = [columnLabel, "Amount (₦)"];
    const body = rows.map((r) =>
      [csvEscape(r.label), csvEscape(r.amount)].join(","),
    );

    const csv = [headers.join(","), ...body].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-lg border border-border bg-white">
      {/* Controls */}
      {showDateRange ? (
      <div className="flex w-full min-w-0 flex-col gap-2 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={(value) =>
            onDateRangeChange({ startDate: value, endDate })
          }
          onEndChange={(value) =>
            onDateRangeChange({ startDate, endDate: value })
          }
        />

        {/* <button
          onClick={handleExport}
          disabled={!rows.length}
          className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export
        </button> */}
      </div>
      ) : null}

      {/* Table */}
      <table className="w-full text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-6 py-4 text-left">{columnLabel}</th>
            <th className="px-6 py-4 text-right">Amount (₦)</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={
                row.href
                  ? "cursor-pointer hover:bg-muted/40"
                  : "hover:bg-muted/20"
              }
              onClick={
                row.href ? () => router.push(row.href as string) : undefined
              }
              onKeyDown={
                row.href
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(row.href as string);
                      }
                    }
                  : undefined
              }
              tabIndex={row.href ? 0 : undefined}
            >
              <td className="px-6 py-4 capitalize">
                {row.href ? (
                  <Link
                    href={row.href}
                    className="hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {row.label}
                  </Link>
                ) : (
                  row.label
                )}
              </td>
              <td className="px-6 py-4 text-right">
                {formatNaira(row.amount)}
              </td>
            </tr>
          ))}

          {summaryRows.map((s) => (
            <tr key={s.label} className={s.colorClass}>
              <td className="px-6 py-4 font-bold">{s.label}</td>
              <td className="px-6 py-4 text-right font-bold">
                {formatNaira(s.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
