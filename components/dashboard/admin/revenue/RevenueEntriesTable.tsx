"use client";

import React, { useMemo } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import Table from "@/components/tables/list/page";
import type { RevenueEntry } from "@/redux/slice/admin/revenue-entry/revenue-entry";

export interface RevenueEntriesTableProps {
  headName: string;
  items: RevenueEntry[];
  loading: boolean;
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onView: (item: RevenueEntry) => void;
  onEdit: (item: RevenueEntry) => void;
  onDelete: (item: RevenueEntry) => void;
}

export function RevenueEntriesTable({
  headName,
  items,
  loading,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: Readonly<RevenueEntriesTableProps>) {
  const columns = useMemo(() => {
    return [
      {
        key: "createdAt",
        header: "Date",
        render: (item: RevenueEntry) =>
          item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
      },
      {
        key: "headId",
        header: "Revenue Head",
        render: () => headName,
      },
      { key: "description", header: "Description" },
      {
        key: "amount",
        header: "Amount",
        render: (item: RevenueEntry) => `₦${(item.amount ?? 0).toLocaleString()}`,
      },
      {
        key: "documentNumber",
        header: "Reference No",
        render: (item: RevenueEntry) => item.documentNumber ?? "—",
      },
      {
        key: "actions",
        header: "Action",
        exportable: false,
        render: (item: RevenueEntry) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-md hover:bg-muted"
              aria-label="View"
              onClick={() => onView(item)}
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-md hover:bg-muted"
              aria-label="Edit"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-md hover:bg-muted"
              aria-label="Delete"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        ),
      },
    ];
  }, [headName, onDelete, onEdit, onView]);

  return (
    <Card className="mt-0 p-4">
      <Table
        columns={columns as any}
        data={items as any}
        emptyMessage={loading ? "Loading..." : "No revenue yet."}
        showPagination
        paginationInfo={{
          total,
          current: currentPage,
          pageSize,
        }}
        onPageChange={onPageChange}
      />
    </Card>
  );
}

