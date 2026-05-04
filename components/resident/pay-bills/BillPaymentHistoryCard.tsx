"use client";

import React, { useMemo } from "react";
import { useDispatch } from "react-redux";

import type { AppDispatch } from "@/redux/store";
import { getBillPaymentHistory } from "@/redux/slice/resident/bills-payment/bills-payment";
import type { ResidentBillsPaymentState } from "@/redux/slice/resident/bills-payment/bills-payment-slice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Table from "@/components/tables/list/page";
import Loader from "@/components/ui/Loader";

type BillHistoryRow = Record<string, unknown> & { id?: string };

function primitiveToDisplay(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    return String(v);
  return fallback || "—";
}

function firstPrimitive(
  item: BillHistoryRow,
  keys: string[],
  fallback = "",
): string {
  for (const k of keys) {
    const v = item[k];
    const s = primitiveToDisplay(v, "");
    if (s) return s;
  }
  return fallback || "—";
}

const HISTORY_COLUMNS = [
  {
    key: "createdAt",
    header: "Date",
    render: (item: BillHistoryRow) => {
      const raw = firstPrimitive(
        item,
        [
          "createdAt",
          "created_at",
          "transaction_date",
          "transactionDate",
          "date",
          "time",
        ],
        "",
      );
      if (!raw || raw === "—") return "-";
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? raw : d.toLocaleString();
    },
    exportValue: (item: BillHistoryRow) =>
      firstPrimitive(
        item,
        ["createdAt", "created_at", "transaction_date", "date"],
        "",
      ),
  },
  {
    key: "product",
    header: "Product",
    render: (item: BillHistoryRow) =>
      firstPrimitive(
        item,
        ["product", "category", "category_code", "service_type", "network"],
        "-",
      ),
  },
  {
    key: "biller",
    header: "Biller",
    render: (item: BillHistoryRow) =>
      firstPrimitive(
        item,
        ["biller_name", "biller", "biller_code", "network"],
        "-",
      ),
  },
  // {
  //   key: "customer",
  //   header: "Customer",
  //   render: (item: BillHistoryRow) =>
  //     firstPrimitive(item, ["customer", "customer_id", "bill_ref"], "-"),
  // },
  {
    key: "amount",
    header: "Amount",
    align: "right" as const,
    render: (item: BillHistoryRow) => {
      const amt = Number(item?.amount ?? item?.charged_amount ?? item?.value);
      if (!Number.isFinite(amt)) return "-";
      const cur = primitiveToDisplay(item?.currency, "₦");
      return `${cur}${amt.toLocaleString()}`;
    },
    exportValue: (item: BillHistoryRow) => {
      const amt = Number(item?.amount ?? item?.charged_amount ?? item?.value);
      return Number.isFinite(amt) ? amt : "";
    },
  },
  // {
  //   key: "reference",
  //   header: "Reference",
  //   render: (item: BillHistoryRow) =>
  //     firstPrimitive(item, ["reference", "tx_ref", "id"], "-"),
  // },
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Unwraps API shapes: top-level array, or nested `{ data: { data: [], total, ... } }`. */
function extractHistoryRows(
  history: Record<string, unknown> | null,
): BillHistoryRow[] {
  if (!history) return [];

  const innerData = history.data;
  if (Array.isArray(innerData)) return innerData as BillHistoryRow[];

  if (isRecord(innerData)) {
    const nested = innerData.data;
    if (Array.isArray(nested)) return nested as BillHistoryRow[];
  }

  const alt = history.history;
  if (Array.isArray(alt)) return alt as BillHistoryRow[];
  const tx = history.transactions;
  if (Array.isArray(tx)) return tx as BillHistoryRow[];
  return [];
}

function extractHistoryPagination(
  history: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!history) return {};
  const topPagination =
    (history.pagination as Record<string, unknown>) ??
    (history.meta as Record<string, unknown>);
  if (isRecord(topPagination) && Object.keys(topPagination).length > 0) {
    return topPagination;
  }
  const inner = history.data;
  if (isRecord(inner) && Array.isArray(inner.data)) {
    return inner;
  }
  return {};
}

export type BillPaymentHistoryCardProps = Readonly<{
  billsPayment: ResidentBillsPaymentState;
  historyPage: number;
  historyLimit: number;
  onHistoryPageChange: (page: number) => void;
}>;

export function BillPaymentHistoryCard({
  billsPayment,
  historyPage,
  historyLimit,
  onHistoryPageChange,
}: BillPaymentHistoryCardProps) {
  const dispatch = useDispatch<AppDispatch>();

  const historyPayload = billsPayment.history ?? null;

  const historyRows = useMemo(
    () => extractHistoryRows(historyPayload),
    [historyPayload],
  );

  const paginationRaw = useMemo(
    () => extractHistoryPagination(historyPayload),
    [historyPayload],
  );

  const historyTotal =
    Number(paginationRaw?.total ?? paginationRaw?.totalItems) ||
    historyRows.length ||
    0;
  const historyCurrent =
    Number(
      paginationRaw?.page ??
        paginationRaw?.currentPage ??
        paginationRaw?.current_page,
    ) || historyPage;
  const historyPageSize =
    Number(
      paginationRaw?.limit ??
        paginationRaw?.pageSize ??
        paginationRaw?.page_size,
    ) || historyLimit;

  return (
    <Card className="p-6">
      <CardHeader className="px-0 md:px-0">
        <CardTitle>Bill Payment History</CardTitle>
      </CardHeader>
      <CardContent className="px-0 md:px-0">
        <Table<BillHistoryRow>
          columns={HISTORY_COLUMNS}
          data={historyRows}
          emptyMessage={
            billsPayment.historyStatus === "isLoading" ? (
              <Loader label="Loading history..." />
            ) : (
              "No bill payment history yet."
            )
          }
          showPagination
          paginationInfo={{
            total: historyTotal,
            current: historyCurrent,
            pageSize: historyPageSize,
          }}
          onPageChange={(page) => {
            onHistoryPageChange(page);
          }}
          enableExport
          exportFileName="bill-payment-history"
          onExportRequest={async () => {
            const res = await dispatch(
              getBillPaymentHistory({ page: 1, limit: 50000 }),
            ).unwrap();
            return extractHistoryRows((res ?? {}) as Record<string, unknown>);
          }}
        />
      </CardContent>
    </Card>
  );
}
