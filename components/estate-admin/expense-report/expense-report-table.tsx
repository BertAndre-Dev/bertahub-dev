"use client";

import React, { useRef, useState } from "react";
import { Calendar, ChevronDown, Download } from "lucide-react";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";

export interface ReportTableRow {
  key: string;
  label: string;
  amount: number;
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
  exportFileName?: string;
}

function formatNaira(n: number): string {
  return `₦${Number(n ?? 0).toLocaleString()}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDatePill(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (isNaN(d.getTime())) return iso;
  return `${ordinal(d.getUTCDate())} ${MONTH_SHORT[d.getUTCMonth()]}`;
}

function toOrdinalRange(start: string, end: string): string {
  if (!start && !end) return "All dates";
  if (!start) return `Until ${formatDatePill(end)}`;
  if (!end) return `From ${formatDatePill(start)}`;
  return `${formatDatePill(start)} – ${formatDatePill(end)}`;
}

function csvEscape(value: string | number): string {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n"))
    return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function PillDropdown({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted/40 cursor-pointer"
      >
        {icon}
        <span>{label}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function DateRangeDropdown({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}) {
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  return (
    <PillDropdown
      icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
      label={toOrdinalRange(startDate, endDate)}
    >
      {(close) => (
        <div className="w-72 rounded-xl border border-border bg-white p-4 shadow-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Date Range
          </p>

          <div className="space-y-3">
            <IsoLinkedRangeStart
              startDate={localStart}
              endDate={localEnd}
              onStartChange={setLocalStart}
              className="w-full"
            />
            <IsoLinkedRangeEnd
              startDate={localStart}
              endDate={localEnd}
              onEndChange={setLocalEnd}
              className="w-full"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setLocalStart("");
                setLocalEnd("");
                onChange({ startDate: "", endDate: "" });
                close();
              }}
              className="flex-1 rounded-md border border-border py-1.5 text-sm hover:bg-muted/40 cursor-pointer"
            >
              Reset
            </button>

            <button
              onClick={() => {
                onChange({ startDate: localStart, endDate: localEnd });
                close();
              }}
              className="flex-1 rounded-md bg-primary py-1.5 text-sm font-semibold text-white hover:opacity-90 cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </PillDropdown>
  );
}

function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReportTableFilterOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? label;

  return (
    <PillDropdown
      icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
      label={selectedLabel}
    >
      {(close) => (
        <div className="min-w-[180px] rounded-xl border border-border bg-white py-1 shadow-xl">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                onChange(o.value);
                close();
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-muted/40 cursor-pointer ${
                value === o.value ? "font-semibold text-primary" : ""
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </PillDropdown>
  );
}

export function ReportTable({
  columnLabel,
  rows,
  summaryRows,
  filterLabel,
  filterOptions,
  filterValue,
  onFilterChange,
  startDate,
  endDate,
  onDateRangeChange,
  exportFileName = "report",
}: ReportTableProps) {
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
      <div className="flex justify-end gap-2 border-b p-4">
        <DateRangeDropdown
          startDate={startDate}
          endDate={endDate}
          onChange={onDateRangeChange}
        />

        <FilterDropdown
          label={filterLabel}
          options={filterOptions}
          value={filterValue}
          onChange={onFilterChange}
        />

        <button
          onClick={handleExport}
          disabled={!rows.length}
          className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

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
            <tr key={row.key} className="hover:bg-muted/20">
              <td className="px-6 py-4 capitalize">{row.label}</td>
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
