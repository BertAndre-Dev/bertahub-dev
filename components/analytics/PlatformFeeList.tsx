"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import Table from "@/components/tables/list/page";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format-date";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import type {
  PlatformFeeListItem,
  PlatformFeePagination,
} from "@/types/analytics";

type TableRow = PlatformFeeListItem;

type PlatformFeeListProps = Readonly<{
  items: PlatformFeeListItem[];
  pagination: PlatformFeePagination | null;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSize?: number;
  onExportRequest?: () => Promise<PlatformFeeListItem[]> | PlatformFeeListItem[];
  className?: string;
}>;

export function PlatformFeeList({
  items,
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSize,
  onExportRequest,
  className,
}: PlatformFeeListProps) {
  const columns = useMemo(
    () => [
      {
        key: "date",
        header: "Date",
        render: (item: TableRow) => formatDate(item.date),
        exportValue: (item: TableRow) => formatDate(item.date, item.date ?? ""),
      },
      {
        key: "source",
        header: "Source",
        render: (item: TableRow) => item.source || "—",
      },
      {
        key: "description",
        header: "Description",
        render: (item: TableRow) => (
          <span
            className="block max-w-72 truncate normal-case"
            title={item.description}
          >
            {item.description || "—"}
          </span>
        ),
      },
      {
        key: "fee",
        header: "Fee",
        align: "right" as const,
        render: (item: TableRow) =>
          formatTransactionAmount(Number(item.fee ?? 0)),
        exportValue: (item: TableRow) => Number(item.fee ?? 0),
      },
    ],
    [],
  );

  const page = pagination?.page ?? 1;
  const limit = pageSize ?? pagination?.limit ?? items.length;
  const total = pagination?.total ?? items.length;

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Settled fees
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fee transactions in the selected period
        </p>
      </div>
      <div className="p-4">
        <Table
          columns={columns}
          data={items}
          emptyMessage="No settled fees in this period"
          showPagination={Boolean(pagination && total > 0)}
          paginationInfo={
            pagination
              ? {
                  total,
                  current: page,
                  pageSize: limit,
                }
              : undefined
          }
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          enableExport
          exportFileName="platform_fee_transactions"
          onExportRequest={onExportRequest}
        />
      </div>
    </Card>
  );
}

export default PlatformFeeList;
