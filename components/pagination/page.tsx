"use client";

import UIPagination, {
  type PaginationInfo,
} from "@/components/ui/pagination";

export type { PaginationInfo };

export interface PaginationProps {
  paginationInfo: PaginationInfo;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  itemLabel?: string;
  className?: string;
}

export default function Pagination({
  paginationInfo,
  onPageChange,
  disabled = false,
  itemLabel = "records",
  className,
}: PaginationProps) {
  return (
    <UIPagination
      paginationInfo={paginationInfo}
      onPageChange={onPageChange}
      disabled={disabled}
      itemLabel={itemLabel}
      className={className}
    />
  );
}
