import React from "react";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";

type Props = {
  columns: any[];
  data: any[];
  emptyMessage: string;
  showPagination: boolean;
  paginationInfo: { total: number; current: number; pageSize: number };
  onPageChange: (newPage: number) => void | Promise<void>;
  onPageSizeChange?: (pageSize: number) => void;
  currentPage: number;
  totalPages: number;
  onExportRequest?: () => Promise<any[]>;
};

export function HistoryTransactionsTab({
  columns,
  data,
  emptyMessage,
  showPagination,
  paginationInfo,
  onPageChange,
  onPageSizeChange,
  currentPage,
  totalPages,
  onExportRequest,
}: Readonly<Props>) {
  return (
    <>
      <Table
        columns={columns}
        data={data}
        emptyMessage={emptyMessage}
        showPagination={showPagination}
        paginationInfo={paginationInfo}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        enableExport
        exportFileName="transactions"
        onExportRequest={onExportRequest}
      />

      <div className="flex justify-end items-center gap-2 mt-4">
        <Button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Prev
        </Button>
        <Button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </>
  );
}

