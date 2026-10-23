"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import Table from "@/components/tables/list/page";
import { Card } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api-error";
import { getExpenseEntriesByHead } from "@/redux/slice/estate-admin/expense-entry/expense-entry";
import { fetchRevenueEntries } from "@/redux/slice/admin/revenue-entry/revenue-entry";
import type { AppDispatch } from "@/redux/store";

type EntryKind = "expense" | "revenue";

type EntryRow = {
  id?: string;
  _id?: string;
  createdAt?: string;
  description?: string;
  amount?: number;
  documentNumber?: string;
  headName?: string;
};

type EntryListPayload = {
  data?: EntryRow[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function entryId(item: { id?: string; _id?: string }, index: number): string {
  return item.id || item._id || `entry-${index}`;
}

export function ReportHeadEntriesPage({ kind }: { readonly kind: EntryKind }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams<{ headId: string }>();
  const searchParams = useSearchParams();
  const headId = params?.headId ?? "";
  const headName =
    searchParams.get("name") ||
    (kind === "expense" ? "Expense head" : "Revenue head");

  const [startDate, setStartDate] = useState(
    () => searchParams.get("startDate") ?? "",
  );
  const [endDate, setEndDate] = useState(
    () => searchParams.get("endDate") ?? "",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [items, setItems] = useState<EntryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!headId) return;

    let cancelled = false;
    setLoading(true);

    const query = {
      headId,
      page,
      limit: pageSize,
      startDate: toIsoIfPresent(startDate),
      endDate: toIsoIfPresent(endDate),
    };
    const request =
      kind === "expense"
        ? dispatch(getExpenseEntriesByHead(query))
        : dispatch(fetchRevenueEntries(query));

    void request
      .unwrap()
      .then((res) => {
        if (cancelled) return;
        const payload = res as EntryListPayload;
        const rows = Array.isArray(payload.data) ? payload.data : [];
        setItems(
          rows.map((item, index) => ({
            ...item,
            id: entryId(item, index),
            headName,
          })),
        );
        setTotal(payload.pagination?.total ?? rows.length);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        const message = getApiErrorMessage(error);
        if (message) toast.error(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, endDate, headId, headName, kind, page, pageSize, startDate]);

  const headColumnLabel = kind === "expense" ? "Expense Head" : "Revenue Head";

  const columns = useMemo(
    () => [
      {
        key: "headName",
        header: headColumnLabel,
        render: (item: EntryRow) => item.headName || headName,
        exportValue: (item: EntryRow) => item.headName || headName,
      },
      {
        key: "createdAt",
        header: "Date",
        render: (item: EntryRow) =>
          item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
        exportValue: (item: EntryRow) =>
          item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "",
      },
      {
        key: "description",
        header: "Description",
        render: (item: EntryRow) => item.description || "—",
        exportValue: (item: EntryRow) => item.description || "",
      },
      {
        key: "amount",
        header: "Amount",
        render: (item: EntryRow) =>
          `₦${Number(item.amount ?? 0).toLocaleString()}`,
        exportValue: (item: EntryRow) => item.amount ?? 0,
      },
      {
        key: "documentNumber",
        header: "Reference No",
        render: (item: EntryRow) => item.documentNumber || "—",
        exportValue: (item: EntryRow) => item.documentNumber || "",
      },
    ],
    [headColumnLabel, headName],
  );

  const title = kind === "expense" ? "Expense entries" : "Revenue entries";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-[#F2F2F2] p-3">
          <Image
            src="/arrow.svg"
            alt="Back to estate reports"
            width={20}
            height={20}
            className="cursor-pointer hover:opacity-80"
            onClick={() => router.back()}
          />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold">{headName}</h1>
          <p className="text-muted-foreground mt-1">{title}</p>
        </div>
      </div>

      <Card className="p-4">
        <Table
          columns={columns}
          data={items}
          emptyMessage={loading ? "Loading entries..." : "No entries for this head."}
          showPagination
          paginationInfo={{
            total,
            current: page,
            pageSize,
          }}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          enableDateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={({ startDate: nextStart, endDate: nextEnd }) => {
            setStartDate(nextStart);
            setEndDate(nextEnd);
            setPage(1);
          }}
          enableExport
          exportFileName={`${kind}-entries`}
        />
      </Card>
    </div>
  );
}
