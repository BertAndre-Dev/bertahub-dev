// components/shared/DataGrid.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import React from "react";

interface DataGridProps<T> {
  data: T[];
  keyField: keyof T;
  renderHeader: (item: T) => React.ReactNode;
  renderContent: (item: T) => React.ReactNode;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onClick?: (item: T) => void;
}

export default function DataGrid<T>({
  data,
  keyField,
  renderHeader,
  renderContent,
  onEdit,
  onDelete,
  onClick,
}: DataGridProps<T>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((item) => (
        <Card
          key={String(item[keyField])}
          className="p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onClick?.(item)}
        >
          <div className="space-y-4">
            {renderHeader(item)}
            {renderContent(item)}

            <div className="flex gap-2 pt-4">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
