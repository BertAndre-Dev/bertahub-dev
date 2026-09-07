"use client";

import React, { useMemo } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import Table from "@/components/tables/list/page";
import type { ExpenseEntry } from "@/redux/slice/estate-admin/expense-entry/expense-entry";

export interface ExpenseEntriesTableProps {
  headName: string;
  items: ExpenseEntry[];
  loading: boolean;
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onView: (item: ExpenseEntry) => void;
  onEdit: (item: ExpenseEntry) => void;
  onDelete: (item: ExpenseEntry) => void;
}

export function ExpenseEntriesTable({
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
}: Readonly<ExpenseEntriesTableProps>) {
  const columns = useMemo(() => {
    return [
      {
        key: "createdAt",
        header: "Date",
        render: (item: ExpenseEntry) =>
          item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
      },
      {
        key: "headId",
        header: "Expense Head",
        render: () => headName,
      },
      { key: "description", header: "Description" },
      {
        key: "amount",
        header: "Amount",
        render: (item: ExpenseEntry) => `₦${(item.amount ?? 0).toLocaleString()}`,
      },
      {
        key: "documentNumber",
        header: "Reference No",
        render: (item: ExpenseEntry) => item.documentNumber ?? "—",
      },
      {
        key: "actions",
        header: "Action",
        exportable: false,
        render: (item: ExpenseEntry) => (
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
        emptyMessage={loading ? "Loading..." : "No expenses yet."}
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

