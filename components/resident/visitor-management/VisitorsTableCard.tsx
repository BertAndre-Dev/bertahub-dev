"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";
import { Eye, Edit, Trash2, QrCode } from "lucide-react";
import {
  formatVisitorDateTime,
  formatVisitorPerson,
  visitorGateStatus,
  type ResidentVisitorData,
} from "./types";
import { CopyButton } from "@/components/ui/copy-button";
import { IconTooltip } from "@/components/ui/tooltip";

export function VisitorsTableCard({
  visitors,
  loading,
  startDate,
  endDate,
  onDateRangeChange,
  paginationInfo,
  onPageChange,
  onPageSizeChange,
  onExportRequest,
  onView,
  onEdit,
  onDelete,
  onViewQrCode,
}: Readonly<{
  visitors: ResidentVisitorData[];
  loading: boolean;
  startDate: string;
  endDate: string;
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
  paginationInfo: { total: number; current: number; pageSize: number };
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onExportRequest?: () => Promise<any[]>;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (visitor: ResidentVisitorData) => void;
  onViewQrCode: (visitor: ResidentVisitorData) => void;
}>) {
  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Created",
        render: (item: ResidentVisitorData) =>
          formatVisitorDateTime(item.createdAt),
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
        key: "visitorCode",
        header: "Visitor Code",
        render: (item: ResidentVisitorData) => (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">
              {item.visitorCode}
            </span>
            {item.visitorCode ? (
              <CopyButton value={item.visitorCode} title="Copy visitor code" />
            ) : null}
          </div>
        ),
      },
      {
        key: "purpose",
        header: "Purpose",
        render: (item: ResidentVisitorData) => item.purpose || "—",
      },
      {
        key: "visitingType",
        header: "Visit Type",
        render: (item: ResidentVisitorData) => {
          if (!item.visitingType) return "—";
          return (
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                item.visitingType === "LONG_VISIT"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {item.visitingType === "LONG_VISIT"
                ? "Long Visit"
                : "Short Visit"}
            </span>
          );
        },
      },
      {
        key: "visitStartDate",
        header: "Visit Start",
        render: (item: ResidentVisitorData) =>
          formatVisitorDateTime(item.visitStartDate),
      },
      {
        key: "visitEndDate",
        header: "Visit End",
        render: (item: ResidentVisitorData) =>
          formatVisitorDateTime(item.visitEndDate),
      },
      {
        key: "status",
        header: "Status",
        render: (item: ResidentVisitorData) => {
          const status = visitorGateStatus(item);
          return (
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${status.className}`}
            >
              {status.label}
            </span>
          );
        },
      },
      {
        key: "checkinTime",
        header: "Check-in",
        render: (item: ResidentVisitorData) =>
          formatVisitorDateTime(item.checkinTime),
      },
      {
        key: "checkoutTime",
        header: "Check-out",
        render: (item: ResidentVisitorData) =>
          formatVisitorDateTime(item.checkoutTime),
      },
      {
        key: "viewedBy",
        header: "Viewed By",
        render: (item: ResidentVisitorData) =>
          formatVisitorPerson(item.viewedBy) || "—",
      },
      {
        key: "checkedOutBy",
        header: "Checked Out By",
        render: (item: ResidentVisitorData) =>
          formatVisitorPerson(item.checkedOutBy) || "—",
      },
      {
        key: "actions",
        header: "Actions",
        render: (item: ResidentVisitorData) => (
          <div className="flex flex-row items-center gap-2">
            <IconTooltip label="View">
              <Button
                className="cursor-pointer"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(item.id);
                }}
                aria-label="View"
              >
                <Eye className="w-4 h-4 mr-1" />
              </Button>
            </IconTooltip>
            <IconTooltip
              label={
                item.qrCodeDataUrl ? "View QR code" : "QR code not available"
              }
            >
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 cursor-pointer hover:bg-blue-200 disabled:opacity-50"
                disabled={!item.qrCodeDataUrl}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewQrCode(item);
                }}
                aria-label={
                  item.qrCodeDataUrl ? "View QR code" : "QR code not available"
                }
              >
                <QrCode className="w-4 h-4 mr-1" />
              </Button>
            </IconTooltip>
            <IconTooltip label="Edit">
              <Button
                variant="outline"
                className="cursor-pointer"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item.id);
                }}
                aria-label="Edit"
              >
                <Edit className="w-4 h-4 mr-1 cursor-pointer" />
              </Button>
            </IconTooltip>
            <IconTooltip label="Delete visitor">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive cursor-pointer hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                aria-label="Delete visitor"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </IconTooltip>
          </div>
        ),
      },
    ],
    [onDelete, onEdit, onView, onViewQrCode],
  );

  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-4">My Visitors</h2>
      <Table
        columns={columns}
        data={visitors || []}
        emptyMessage={
          loading
            ? "Loading visitors..."
            : "You haven't created any visitors yet."
        }
        enableDateRangeFilter
        defaultDateRangeDays={0}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
        showPagination
        paginationInfo={paginationInfo}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        enableExport
        exportFileName="visitors"
        onExportRequest={onExportRequest}
      />
    </Card>
  );
}
