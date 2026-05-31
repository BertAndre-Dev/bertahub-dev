"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";

export interface PaginationInfo {
  total: number;
  current: number;
  pageSize: number;
}

export interface PaginationProps {
  paginationInfo: PaginationInfo;
  onPageChange?: (page: number) => void;
  disabled?: boolean;
  /** Label for the counted records, e.g. "announcements" or "records". */
  itemLabel?: string;
  className?: string;
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
  disabled = false,
  itemLabel = "records",
  className = "",
}: PaginationProps) {
  const totalPages = Math.max(
    1,
    Math.ceil(paginationInfo.total / paginationInfo.pageSize),
  );

  const visiblePages = useMemo(
    () => getVisiblePages(paginationInfo.current, totalPages),
    [paginationInfo.current, totalPages],
  );

  if (paginationInfo.total === 0) return null;

  const rangeStart =
    (paginationInfo.current - 1) * paginationInfo.pageSize + 1;
  const rangeEnd = Math.min(
    paginationInfo.current * paginationInfo.pageSize,
    paginationInfo.total,
  );

  return (
    <div
      className={[
        "flex flex-col md:flex-row items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 gap-3",
        className,
      ].join(" ")}
    >
      <p className="text-sm text-muted-foreground">
        Showing {rangeStart}–{rangeEnd} of {paginationInfo.total} {itemLabel}
      </p>

      {totalPages > 1 && (
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
      )}
    </div>
  );
}
