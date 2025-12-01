"use client"

import React from "react"
import { Button } from "@/components/ui/button"

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  align?: "left" | "center" | "right"
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  onRowClick?: (item: T) => void
  showPagination?: boolean
  paginationInfo?: {
    total: number
    current: number
    pageSize: number
  }
  onPrevPage?: () => void
  onNextPage?: () => void
  onPageChange?: (newPage: number) => void;
}

export default function Table<T extends { id?: string }>({
  columns,
  data,
  emptyMessage = "No records found",
  onRowClick,
  showPagination = false,
  paginationInfo,
  onPrevPage,
  onNextPage,
}: TableProps<T>) {
  return (
    <div className="overflow-hidden border rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-6 py-4 text-${col.align || "left"} font-semibold whitespace-nowrap`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {data.length > 0 ? (
              data.map((item, index) => (
                <tr
                  key={`${item.id ?? JSON.stringify(item)}-${index}`} // ✅ unique key
                  className={`transition-colors ${
                    onRowClick ? "hover:bg-muted/30 cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-6 py-4 text-${col.align || "left"} whitespace-nowrap capitalize`}
                    >
                      {col.render ? col.render(item) : String((item as any)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            )}
        </tbody>

        </table>
      </div>

      {showPagination && paginationInfo && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Showing {data.length} of {paginationInfo.total} records
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevPage}
              disabled={paginationInfo.current <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={paginationInfo.current * paginationInfo.pageSize >= paginationInfo.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
