"use client";

import React, { useEffect, useRef } from "react";
import Select from "react-select";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";
import type {
  CompanyOperationsReportingField,
  CompanyOperationsReportingType,
} from "@/redux/slice/company/operations-reporting/company-operations-reporting";

type SelectOption = { label: string; value: string };

type Props = {
  types: CompanyOperationsReportingType[];
  fields: CompanyOperationsReportingField[];
  selectedTypeId: string;
  selectedFieldId: string;
  startDate: string;
  endDate: string;
  search: string;
  typesLoading?: boolean;
  fieldsLoading?: boolean;
  onTypeChange: (typeId: string) => void;
  onFieldChange: (fieldId: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onResetDates: () => void;
  onSearchChange: (value: string) => void;
};

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

export function CompanyOperationsReportsFiltersBar({
  types,
  fields,
  selectedTypeId,
  selectedFieldId,
  startDate,
  endDate,
  search,
  typesLoading = false,
  fieldsLoading = false,
  onTypeChange,
  onFieldChange,
  onStartDateChange,
  onEndDateChange,
  onResetDates,
  onSearchChange,
}: Readonly<Props>) {
  const didInitDefaultRangeRef = useRef(false);

  useEffect(() => {
    if (didInitDefaultRangeRef.current) return;
    if (startDate || endDate) return;
    didInitDefaultRangeRef.current = true;

    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 30);

    const toIso = (d: Date) =>
      new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
        .toISOString()
        .slice(0, 10);

    onStartDateChange(toIso(start));
    onEndDateChange(toIso(now));
  }, [startDate, endDate, onStartDateChange, onEndDateChange]);

  const typeOptions: SelectOption[] = types.map((t) => ({
    label: t.name,
    value: getId(t),
  }));

  const fieldOptions: SelectOption[] = fields.map((f) => ({
    label: f.label,
    value: getId(f),
  }));

  const selectedTypeOption =
    typeOptions.find((o) => o.value === selectedTypeId) ?? null;
  const selectedFieldOption =
    fieldOptions.find((o) => o.value === selectedFieldId) ?? null;

  const selectStyles = {
    control: (base: object) => ({ ...base, cursor: "pointer", minHeight: 40 }),
    option: (base: object) => ({ ...base, cursor: "pointer" }),
    dropdownIndicator: (base: object) => ({ ...base, cursor: "pointer" }),
    clearIndicator: (base: object) => ({ ...base, cursor: "pointer" }),
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="ops-type">
              Reporting type
            </label>
            <Select
              inputId="ops-type"
              options={typeOptions}
              value={selectedTypeOption}
              onChange={(opt) => onTypeChange(opt?.value ?? "")}
              placeholder={typesLoading ? "Loading types..." : "Select type"}
              isDisabled={typesLoading || !typeOptions.length}
              isSearchable
              styles={selectStyles}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="ops-field">
              Report section
            </label>
            <Select
              inputId="ops-field"
              options={fieldOptions}
              value={selectedFieldOption}
              onChange={(opt) => onFieldChange(opt?.value ?? "")}
              placeholder={
                !selectedTypeId
                  ? "Select a type first"
                  : fieldsLoading
                    ? "Loading sections..."
                    : "Select section"
              }
              isDisabled={!selectedTypeId || fieldsLoading || !fieldOptions.length}
              isSearchable
              styles={selectStyles}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="ops-start-date">
                From
              </label>
              <IsoLinkedRangeStart
                id="ops-start-date"
                startDate={startDate}
                endDate={endDate}
                onStartChange={onStartDateChange}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="ops-end-date">
                To
              </label>
              <IsoLinkedRangeEnd
                id="ops-end-date"
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

          <div className="w-full lg:max-w-md">
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search entries by any field value"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
