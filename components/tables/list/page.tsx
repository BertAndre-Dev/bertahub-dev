"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
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
}: TableProps<T>) {
  if (!paginationInfo) {
    showPagination = false;
  }

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
      {enableSearch && (
        <div className="p-4 border-b bg-muted/30">
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
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
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
