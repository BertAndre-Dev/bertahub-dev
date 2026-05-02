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
        ["createdAt", "created_at", "date", "time"],
        "",
      );
      if (!raw || raw === "—") return "-";
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? raw : d.toLocaleString();
    },
    exportValue: (item: BillHistoryRow) =>
      firstPrimitive(item, ["createdAt", "created_at", "date"], ""),
  },
  {
    key: "product",
    header: "Product",
    render: (item: BillHistoryRow) =>
      firstPrimitive(
        item,
        ["product", "category", "category_code", "service_type"],
        "-",
      ),
  },
  {
    key: "biller",
    header: "Biller",
    render: (item: BillHistoryRow) =>
      firstPrimitive(item, ["biller_name", "biller", "biller_code"], "-"),
  },
  {
    key: "customer",
    header: "Customer",
    render: (item: BillHistoryRow) =>
      firstPrimitive(item, ["customer", "customer_id", "bill_ref"], "-"),
  },
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
  {
    key: "status",
    header: "Status",
    render: (item: BillHistoryRow) => {
      const statusRaw = firstPrimitive(
        item,
        ["status", "paymentStatus", "state"],
        "",
      );
      const status = statusRaw.toLowerCase();
      if (!status || status === "—") return "-";
      let cls = "text-yellow-600 font-medium";
      if (status === "successful") cls = "text-green-600 font-medium";
      else if (status === "failed") cls = "text-red-600 font-medium";
      return <span className={cls}>{status}</span>;
    },
    exportValue: (item: BillHistoryRow) =>
      firstPrimitive(item, ["status", "paymentStatus", "state"], ""),
  },
  {
    key: "reference",
    header: "Reference",
    render: (item: BillHistoryRow) =>
      firstPrimitive(item, ["reference", "tx_ref", "id"], "-"),
  },
];

function extractHistoryRows(
  history: Record<string, unknown> | null,
): BillHistoryRow[] {
  if (!history) return [];
  const d = history.data;
  if (Array.isArray(d)) return d as BillHistoryRow[];
  const alt = history.history;
  if (Array.isArray(alt)) return alt as BillHistoryRow[];
  const tx = history.transactions;
  if (Array.isArray(tx)) return tx as BillHistoryRow[];
  return [];
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

  const paginationRaw = useMemo(() => {
    const h = historyPayload as Record<string, unknown> | null;
    return (
      (h?.pagination as Record<string, unknown>) ??
      (h?.meta as Record<string, unknown>) ??
      {}
    );
  }, [historyPayload]);

  const historyTotal =
    Number(paginationRaw?.total ?? paginationRaw?.totalItems) ||
    historyRows.length ||
    0;
  const historyCurrent =
    Number(paginationRaw?.page ?? paginationRaw?.currentPage) || historyPage;
  const historyPageSize =
    Number(paginationRaw?.limit ?? paginationRaw?.pageSize) || historyLimit;

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
            const payload = (res ?? {}) as Record<string, unknown>;
            const d = payload?.data;
            if (Array.isArray(d)) return d as BillHistoryRow[];
            if (Array.isArray(payload?.history))
              return payload.history as BillHistoryRow[];
            if (Array.isArray(payload?.transactions))
              return payload.transactions as BillHistoryRow[];
            return [];
          }}
        />
      </CardContent>
    </Card>
  );
}
