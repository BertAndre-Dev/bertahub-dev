"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  /** Used for CSV export when value differs from display (e.g. formatted dates). Omit to use row[key]. */
  exportValue?: (item: T) => string | number | null | undefined;
  /** Include this column in export. Default true. Set false for action-only columns. */
  exportable?: boolean;
}

interface PaginationInfo {
  total: number;
  current: number;
  pageSize: number;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  showPagination?: boolean;
  paginationInfo?: PaginationInfo;
  onPageChange?: (newPage: number) => void;
  enableSearch?: boolean;
  onSearch?: (value: string) => void;
  /** Show an Export button that downloads table data as CSV. */
  enableExport?: boolean;
  /** Base name for the downloaded file (e.g. "transactions"). Default "export". */
  exportFileName?: string;
  /** Optional: return full dataset for export (e.g. fetch all pages). If not provided, current `data` is exported. */
  onExportRequest?: () => Promise<T[]> | T[];
}

/** Escape a cell for CSV (quotes and commas). */
function csvEscape(value: string | number): string {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r"))
    return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export default function Table<T extends { id?: string }>({
  columns,
  data,
  emptyMessage = "No records found",
  onRowClick,
  showPagination = false,
  paginationInfo,
  onPageChange,
  enableSearch = false,
  onSearch,
  enableExport = false,
  exportFileName = "export",
  onExportRequest,
}: TableProps<T>) {
  if (!paginationInfo) {
    showPagination = false;
  }

  const exportableColumns = columns.filter(
    (col) => col.exportable !== false && col.key !== "actions",
  );
  const [exporting, setExporting] = React.useState(false);

  const handleExport = React.useCallback(async () => {
    try {
      if (onExportRequest) setExporting(true);
      const rows = (await Promise.resolve(onExportRequest?.() ?? data)) ?? data;
      if (!rows?.length) return;
    const headers = exportableColumns.map((col) => csvEscape(col.header));
    const body = rows.map((item) =>
      exportableColumns
        .map((col) => {
          const raw = col.exportValue
            ? col.exportValue(item)
            : (item as Record<string, unknown>)[col.key as string];
          const value =
            raw == null
              ? ""
              : typeof raw === "string" || typeof raw === "number"
                ? raw
                : String(raw);
          return csvEscape(value);
        })
        .join(","),
    );
    const csv = [headers.join(","), ...body].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName.replace(/[^a-z0-9-_]/gi, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [data, onExportRequest, exportableColumns, exportFileName]);

  const totalPages = paginationInfo
    ? Math.ceil(paginationInfo.total / paginationInfo.pageSize)
    : 1;
  const MAX_VISIBLE_PAGES = 4;
  const visiblePages = React.useMemo(() => {
    if (!paginationInfo) return [];
    if (totalPages <= 1) return [1];
    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfWindow = Math.floor(MAX_VISIBLE_PAGES / 2); // 2 when MAX_VISIBLE_PAGES=4
    let start = Math.max(1, paginationInfo.current - halfWindow);
    let end = start + MAX_VISIBLE_PAGES - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [paginationInfo, totalPages]);
  const [searchValue, setSearchValue] = React.useState("");

  return (
    <div className="overflow-hidden border rounded-lg">
      {(enableSearch || enableExport) && (
        <div className="p-4 border-b bg-muted/30 flex flex-wrap items-center gap-3">
          {enableSearch && (
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => {
                const value = e.target.value;
                setSearchValue(value);
                onSearch?.(value);
              }}
              className="h-9 w-64 rounded-md border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          {enableExport && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer gap-2 flex-end"
              onClick={handleExport}
              disabled={(data.length === 0 && !onExportRequest) || exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#D9D9D9] border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-6 py-4 text-${col.align || "left"} font-semibold whitespace-nowrap`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {data.length > 0 ? (
              data.map((item, index) => (
                <tr
                  key={`${item.id ?? JSON.stringify(item)}-${index}`}
                  className={`transition-colors ${onRowClick ? "hover:bg-muted/30 cursor-pointer" : ""}`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-6 py-4 text-${col.align || "left"} whitespace-nowrap capitalize`}
                    >
                      {col.render
                        ? col.render(item)
                        : String((item as any)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPagination && paginationInfo && (
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-border bg-muted/30 gap-2 md:gap-0">
          <p className="text-sm text-muted-foreground">
            Showing {(paginationInfo.current - 1) * paginationInfo.pageSize + 1}{" "}
            -{" "}
            {Math.min(
              paginationInfo.current * paginationInfo.pageSize,
              paginationInfo.total,
            )}{" "}
            of {paginationInfo.total} records
          </p>

          <div className="flex gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPageChange &&
                onPageChange(Math.max(1, paginationInfo.current - 1))
              }
              disabled={paginationInfo.current <= 1}
            >
              Previous
            </Button>

            {/* Page Numbers */}
            {visiblePages.map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === paginationInfo.current ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange && onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            ))}

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPageChange &&
                onPageChange(Math.min(totalPages, paginationInfo.current + 1))
              }
              disabled={paginationInfo.current >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
