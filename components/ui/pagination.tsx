"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  tablePageSizeOptions,
  DEFAULT_TABLE_PAGE_SIZE,
} from "@/lib/table-pagination";

export interface PaginationInfo {
  total: number;
  current: number;
  pageSize: number;
}

export interface PaginationProps {
  paginationInfo: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  disabled?: boolean;
  /** Label for the counted records, e.g. "announcements" or "entries". */
  itemLabel?: string;
  className?: string;
  pageSizeOptions?: readonly number[];
  /** Hide the rows-per-page control. Default false. */
  hidePageSize?: boolean;
}

const MAX_VISIBLE_PAGES = 4;

function getVisiblePages(current: number, totalPages: number): number[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfWindow = Math.floor(MAX_VISIBLE_PAGES / 2);
  let start = Math.max(1, current - halfWindow);
  let end = start + MAX_VISIBLE_PAGES - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function Pagination({
  paginationInfo,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  itemLabel = "entries",
  className = "",
  pageSizeOptions,
  hidePageSize = false,
}: PaginationProps) {
  const pageSize =
    paginationInfo.pageSize > 0
      ? paginationInfo.pageSize
      : DEFAULT_TABLE_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(paginationInfo.total / pageSize));

  const visiblePages = useMemo(
    () => getVisiblePages(paginationInfo.current, totalPages),
    [paginationInfo.current, totalPages],
  );

  const sizeOptions = useMemo(
    () =>
      pageSizeOptions
        ? Array.from(
            new Set([...pageSizeOptions, pageSize].filter((n) => n > 0)),
          ).sort((a, b) => a - b)
        : tablePageSizeOptions(pageSize),
    [pageSize, pageSizeOptions],
  );

  const rangeStart =
    paginationInfo.total === 0
      ? 0
      : (paginationInfo.current - 1) * pageSize + 1;
  const rangeEnd = Math.min(
    paginationInfo.current * pageSize,
    paginationInfo.total,
  );

  const showPageSize = !hidePageSize;
  const showPager = paginationInfo.total > 0 && totalPages > 1;

  if (paginationInfo.total === 0 && !showPageSize) return null;

  return (
    <div
      className={[
        "flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 gap-3",
        className,
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm text-muted-foreground">
          {paginationInfo.total === 0
            ? `Showing 0 of 0 ${itemLabel}`
            : `Showing ${rangeStart} to ${rangeEnd} of ${paginationInfo.total} ${itemLabel}`}
        </p>

        {showPageSize ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Rows per page</span>
            <select
              className="h-8 min-w-14 cursor-pointer rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              value={pageSize}
              aria-label="Rows per page"
              disabled={disabled || !onPageSizeChange}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next) || next <= 0) return;
                onPageSizeChange?.(next);
              }}
            >
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {showPager ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(Math.max(1, paginationInfo.current - 1))}
            disabled={disabled || paginationInfo.current <= 1}
          >
            Previous
          </Button>

          {visiblePages.map((pageNum) => (
            <Button
              key={pageNum}
              variant={
                pageNum === paginationInfo.current ? "default" : "outline"
              }
              size="sm"
              onClick={() => onPageChange?.(pageNum)}
              disabled={disabled}
            >
              {pageNum}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onPageChange?.(Math.min(totalPages, paginationInfo.current + 1))
            }
            disabled={disabled || paginationInfo.current >= totalPages}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
