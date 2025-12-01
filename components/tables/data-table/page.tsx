"use client";

import { useState, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CiSearch } from "react-icons/ci";

interface StatItem {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
}

interface Column {
  key: string;
  label: string;
  render?: (row: any) => ReactNode;
}

export interface Pagination {
  total?: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
}

interface DataListProps {
  title: string;
  description?: string;
  data: any[];
  stats?: StatItem[];
  columns: Column[];
  searchableKeys?: string[];

  pagination?: Pagination; // ✅ Added
  onPageChange?: (page: number) => void; // ✅ Added

  filters?: {
    label: string;
    key: string;
    options: { label: string; value: string }[];
  }[];

  onCreate?: () => void;
  onView?: (row: any) => void;
  loading?: boolean; // ✅ Added
}

export default function DataList({
  title,
  description,
  data,
  stats = [],
  columns,
  pagination,
  onPageChange,
  searchableKeys = [],
  filters = [],
  onCreate,
  onView,
  loading = false,
}: DataListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const filteredData = data.filter((item) => {
    const matchesSearch =
      searchableKeys.length === 0 ||
      searchableKeys.some((key) =>
        String(item[key] ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesFilters = filters.every((filter) => {
      const selected = filterValues[filter.key] || "all";
      return selected === "all" || String(item[filter.key]).toLowerCase() === selected.toLowerCase();
    });

    return matchesSearch && matchesFilters;
  });

  const currentPage = pagination?.currentPage ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>

        {onCreate && (
          <Button className="bg-primary" onClick={onCreate}>
            + Create
          </Button>
        )}
      </div>

      {/* STATS */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="p-4 flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
              {stat.icon && (
                <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* SEARCH */}
      <Card className="p-4 space-y-4">
        <div className="relative">
          <CiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* FILTERS */}
        {filters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <select
                key={filter.key}
                className="border rounded-lg px-3 h-10"
                value={filterValues[filter.key] || "all"}
                onChange={(e) =>
                  setFilterValues({ ...filterValues, [filter.key]: e.target.value })
                }
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </Card>

      {/* TABLE */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 text-left font-semibold">
                  {col.label}
                </th>
              ))}
              {onView && <th className="px-6 py-4 text-right font-semibold">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/20">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {onView && (
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => onView(row)}>
                        View
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-6 text-muted-foreground">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        {pagination && (
          <div className="flex justify-between items-center px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => onPageChange?.(currentPage - 1)}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange?.(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
