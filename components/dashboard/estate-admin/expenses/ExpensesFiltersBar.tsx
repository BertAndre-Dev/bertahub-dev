"use client";

import React from "react";

import { Card } from "@/components/ui/card";
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
}

export function ExpensesFiltersBar({
  startDate,
  endDate,
  search,
  onStartDateChange,
  onEndDateChange,
  onResetDates,
  onSearchChange,
}: Readonly<ExpensesFiltersBarProps>) {
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

