"use client";

import UIPagination, {
  type PaginationInfo,
} from "@/components/ui/pagination";

export type { PaginationInfo };

export interface PaginationProps {
  paginationInfo: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  disabled?: boolean;
  itemLabel?: string;
  className?: string;
  pageSizeOptions?: readonly number[];
  hidePageSize?: boolean;
}

export default function Pagination({
  paginationInfo,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  itemLabel = "entries",
  className,
  pageSizeOptions,
  hidePageSize,
}: PaginationProps) {
  return (
    <UIPagination
      paginationInfo={paginationInfo}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      disabled={disabled}
      itemLabel={itemLabel}
      className={className}
      pageSizeOptions={pageSizeOptions}
      hidePageSize={hidePageSize}
    />
  );
}
