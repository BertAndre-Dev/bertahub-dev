"use client";

import React, { useEffect, useMemo, useRef } from "react";

import { Card } from "@/components/ui/card";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangeFilter } from "@/components/ui/date-range-filter";

export interface ExpensesFiltersBarProps {
  startDate: string;
  endDate: string;
  search: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onResetDates: () => void;
  onSearchChange: (value: string) => void;
  defaultDateRangeDays?: number;
}

export function ExpensesFiltersBar({
  startDate,
  endDate,
  search,
  onStartDateChange,
  onEndDateChange,
  onResetDates,
  onSearchChange,
  defaultDateRangeDays = 0,
}: Readonly<ExpensesFiltersBarProps>) {
  const didInitDefaultRangeRef = useRef(false);
  const exampleDateRange = useMemo(() => getDateRangePlaceholders(), []);
  const showExamplePlaceholders = !defaultDateRangeDays;

  useEffect(() => {
    if (!defaultDateRangeDays) return;
    if (didInitDefaultRangeRef.current) return;
    if (startDate || endDate) return;

    didInitDefaultRangeRef.current = true;

    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - defaultDateRangeDays);

    const toIso = (d: Date) =>
      new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
      )
        .toISOString()
        .slice(0, 10);

    onStartDateChange(toIso(start));
    onEndDateChange(toIso(end));
  }, [
    defaultDateRangeDays,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
  ]);

  return (
    <Card className="mt-0 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center">
          <DateRangeFilter
            startId="eh-start-date"
            endId="eh-end-date"
            startDate={startDate}
            endDate={endDate}
            onStartChange={onStartDateChange}
            onEndChange={onEndDateChange}
            startPlaceholder={
              showExamplePlaceholders ? exampleDateRange.start : undefined
            }
            endPlaceholder={
              showExamplePlaceholders ? exampleDateRange.end : undefined
            }
          />
          {startDate && endDate && (
            <Button type="button" size="sm" variant="outline" onClick={onResetDates}>
              Reset
            </Button>
          )}
        </div>

        <div className="w-full lg:w-[250px] xl:w-[300px] pt-4">
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search expense heads by name"
          />
        </div>
      </div>
    </Card>
  );
}

