import type { PaginationInfo } from "@/components/ui/pagination";

export type OperationsReportingApiPagination = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
};

export const OPERATIONS_REPORT_TYPES_PAGE_SIZE = 10;
export const OPERATIONS_REPORT_ENTRIES_PAGE_SIZE = 10;

export function toPaginationInfo(
  pagination: OperationsReportingApiPagination | null | undefined,
  fallback: { page: number; pageSize: number; total?: number },
): PaginationInfo {
  const pageSize = pagination?.limit ?? fallback.pageSize;
  const total = pagination?.total ?? fallback.total ?? 0;
  const current = pagination?.page ?? fallback.page;
  return { total, current, pageSize };
}
