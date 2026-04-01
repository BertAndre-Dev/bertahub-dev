"use client";

import React from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";

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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="eh-start-date">
              From
            </label>
            <IsoLinkedRangeStart
              id="eh-start-date"
              startDate={startDate}
              endDate={endDate}
              onStartChange={onStartDateChange}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="eh-end-date">
              To
            </label>
            <IsoLinkedRangeEnd
              id="eh-end-date"
              startDate={startDate}
              endDate={endDate}
              onEndChange={onEndDateChange}
            />
          </div>
          {startDate && endDate && (
            <Button type="button" size="sm" variant="outline" onClick={onResetDates}>
              Reset
            </Button>
          )}
        </div>

        <div className="w-full lg:w-[420px]">
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

