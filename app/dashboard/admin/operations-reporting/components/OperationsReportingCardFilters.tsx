"use client";

import React from "react";
import Select from "react-select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";
import type { OperationsReportingField } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";

type SelectOption = { label: string; value: string };

type Props = {
  fields: OperationsReportingField[];
  selectedFieldId: string;
  startDate: string;
  endDate: string;
  search: string;
  fieldsLoading?: boolean;
  onFieldChange: (fieldId: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onResetDates: () => void;
  onSearchChange: (value: string) => void;
};

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

const selectStyles = {
  control: (base: object) => ({ ...base, cursor: "pointer", minHeight: 40 }),
  option: (base: object) => ({ ...base, cursor: "pointer" }),
  dropdownIndicator: (base: object) => ({ ...base, cursor: "pointer" }),
  clearIndicator: (base: object) => ({ ...base, cursor: "pointer" }),
};

export default function OperationsReportingCardFilters({
  fields,
  selectedFieldId,
  startDate,
  endDate,
  search,
  fieldsLoading = false,
  onFieldChange,
  onStartDateChange,
  onEndDateChange,
  onResetDates,
  onSearchChange,
}: Readonly<Props>) {
  const fieldOptions: SelectOption[] = fields.map((f) => ({
    label: f.label,
    value: getId(f),
  }));

  const selectedFieldOption =
    fieldOptions.find((o) => o.value === selectedFieldId) ?? null;

  return (
    <div className="mb-4 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="ops-card-field">
          Report section
        </label>
        <Select
          inputId="ops-card-field"
          options={fieldOptions}
          value={selectedFieldOption}
          onChange={(opt) => onFieldChange(opt?.value ?? "")}
          placeholder={
            fieldsLoading
              ? "Loading sections..."
              : fieldOptions.length
                ? "Select section"
                : "No sections configured"
          }
          isDisabled={fieldsLoading || !fieldOptions.length}
          isSearchable
          styles={selectStyles}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="ops-card-start">
            From
          </label>
          <IsoLinkedRangeStart
            id="ops-card-start"
            startDate={startDate}
            endDate={endDate}
            onStartChange={onStartDateChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="ops-card-end">
            To
          </label>
          <IsoLinkedRangeEnd
            id="ops-card-end"
            startDate={startDate}
            endDate={endDate}
            onEndChange={onEndDateChange}
          />
        </div>
        {startDate && endDate ? (
          <Button type="button" size="sm" variant="outline" onClick={onResetDates}>
            Reset dates
          </Button>
        ) : null}
      </div>

      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search entries by any field value"
      />
    </div>
  );
}
