"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import Table from "@/components/tables/list/page";

export type TransactionsTableCardProps<T> = {
  columns: any[];
  data: T[];
  loading?: boolean;
  total: number;
  current: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export function TransactionsTableCard<T extends { id?: string }>({
  columns,
  data,
  total,
  current,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Readonly<TransactionsTableCardProps<T>>) {
  return (
    <Card className="p-4">
      <Table
        columns={columns}
        data={data}
        showPagination
        enableSearch={false}
        paginationInfo={{
          total,
          current,
          pageSize,
        }}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </Card>
  );
}

