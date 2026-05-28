"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";
import { Trash2 } from "lucide-react";
import type { ResidentOccupantData } from "./types";
import { CopyButton } from "@/components/ui/copy-button";

export function OccupantsTableCard({
  occupants,
  loading,
  onDelete,
}: Readonly<{
  occupants: ResidentOccupantData[];
  loading: boolean;
  onDelete: (occupant: ResidentOccupantData) => void;
}>) {
  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Created At",
        render: (item: ResidentOccupantData) =>
          item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
      },
      {
        key: "occupantCode",
        header: "Occupant Code",
        render: (item: ResidentOccupantData) => (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">
              {item.occupantCode || "—"}
            </span>
            {item.occupantCode ? (
              <CopyButton
                value={item.occupantCode}
                title="Copy occupant code"
              />
            ) : null}
          </div>
        ),
      },
      {
        key: "name",
        header: "Name",
        render: (item: ResidentOccupantData) =>
          `${item.firstName || ""} ${item.lastName || ""}`.trim() || "—",
      },
      {
        key: "relationship",
        header: "Relationship",
        render: (item: ResidentOccupantData) => item.relationship || "—",
      },
      {
        key: "actions",
        header: "Actions",
        exportable: false,
        render: (item: ResidentOccupantData) => (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              title="Delete occupant"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onDelete],
  );

  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-4">My Occupants</h2>
      <Table
        columns={columns}
        data={occupants || []}
        emptyMessage={
          loading ? "Loading occupants..." : "You haven't added any occupants yet."
        }
        enableExport
        exportFileName="occupants"
      />
    </Card>
  );
}

