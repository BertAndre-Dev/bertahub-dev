import React from "react";
import Table from "@/components/tables/list/page";

type Props = {
  columns: any[];
  data: any[];
  emptyMessage: string;
  startDate: string;
  endDate: string;
  onDateRangeChange: (next: { startDate: string; endDate: string }) => void;
  paginationInfo: { total: number; current: number; pageSize: number };
  onPageChange: (p: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onExportRequest?: () => Promise<any[]>;
  defaultDateRangeDays?: number;
};

export function VendsTab({
  columns,
  data,
  emptyMessage,
  startDate,
  endDate,
  onDateRangeChange,
  paginationInfo,
  onPageChange,
  onPageSizeChange,
  onExportRequest,
  defaultDateRangeDays,
}: Readonly<Props>) {
  return (
    <Table
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      enableDateRangeFilter
      defaultDateRangeDays={defaultDateRangeDays}
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={onDateRangeChange}
      showPagination
      paginationInfo={paginationInfo}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      enableExport
      exportFileName="vends"
      onExportRequest={onExportRequest}
    />
  );
}

