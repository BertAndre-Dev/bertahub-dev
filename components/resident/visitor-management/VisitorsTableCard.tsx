"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";
import { Eye, Edit, Trash2 } from "lucide-react";
import type { ResidentVisitorData } from "./types";

export function VisitorsTableCard({
  visitors,
  loading,
  startDate,
  endDate,
  onDateRangeChange,
  paginationInfo,
  onPageChange,
  onExportRequest,
  onView,
  onEdit,
  onDelete,
}: Readonly<{
  visitors: ResidentVisitorData[];
  loading: boolean;
  startDate: string;
  endDate: string;
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
  paginationInfo: { total: number; current: number; pageSize: number };
  onPageChange: (page: number) => void;
  onExportRequest?: () => Promise<any[]>;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (visitor: ResidentVisitorData) => void;
}>) {
  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Created At",
        render: (item: ResidentVisitorData) =>
          item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
      },
      {
        key: "visitorCode",
        header: "Visitor Code",
        render: (item: ResidentVisitorData) => (
          <span className="font-mono text-sm font-semibold">
            {item.visitorCode}
          </span>
        ),
      },
      {
        key: "name",
        header: "Name",
        render: (item: ResidentVisitorData) =>
          `${item.firstName || ""} ${item.lastName || ""}`.trim() || "—",
      },
      {
        key: "phone",
        header: "Phone",
        render: (item: ResidentVisitorData) => item.phone || "—",
      },
      {
        key: "purpose",
        header: "Purpose",
        render: (item: ResidentVisitorData) => item.purpose || "—",
      },
      {
        key: "isVerified",
        header: "Status",
        render: (item: ResidentVisitorData) => (
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              item.isVerified
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {item.isVerified ? "Verified" : "Pending"}
          </span>
        ),
      },
      {
        key: "checkoutTime",
        header: "Checkout Time",
        render: (item: ResidentVisitorData) =>
          item.checkoutTime
            ? new Date(item.checkoutTime).toLocaleTimeString()
            : "—",
      },
      {
        key: "isCheckedOut",
        header: "Checked Out",
        render: (item: ResidentVisitorData) => (item.isCheckedOut ? "Yes" : "No"),
      },
      {
        key: "actions",
        header: "Actions",
        render: (item: ResidentVisitorData) => (
          <div className="flex gap-2">
            <Button
              className="cursor-pointer"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(item.id);
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item.id);
              }}
            >
              <Edit className="w-4 h-4 mr-1 cursor-pointer" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              title="Delete visitor"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onDelete, onEdit, onView],
  );

  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-4">My Visitors</h2>
      <Table
        columns={columns}
        data={visitors || []}
        emptyMessage={
          loading ? "Loading visitors..." : "You haven't created any visitors yet."
        }
        enableDateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
        showPagination
        paginationInfo={paginationInfo}
        onPageChange={onPageChange}
        enableExport
        exportFileName="visitors"
        onExportRequest={onExportRequest}
      />
    </Card>
  );
}

