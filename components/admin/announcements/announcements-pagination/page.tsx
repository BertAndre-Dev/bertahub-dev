"use client";

import Pagination, {
  type PaginationInfo,
} from "@/components/ui/pagination";

export type AnnouncementsPaginationInfo = PaginationInfo;

export interface AnnouncementsPaginationProps {
  paginationInfo: AnnouncementsPaginationInfo;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function AnnouncementsPagination({
  paginationInfo,
  onPageChange,
  disabled = false,
}: AnnouncementsPaginationProps) {
  return (
    <Pagination
      paginationInfo={paginationInfo}
      onPageChange={onPageChange}
      disabled={disabled}
      itemLabel="announcements"
    />
  );
}
