"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Select from "react-select";

import { CompanyOperationsReportEntryCard } from "./CompanyOperationsReportEntryCard";
import { CompanyOperationsReportsFiltersBar } from "./CompanyOperationsReportsFiltersBar";
import { getEntrySortDate } from "./lib/format-entry";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  fetchCompanyOperationsReportingEntries,
  fetchCompanyOperationsReportingFields,
  fetchCompanyOperationsReportingTypes,
  type CompanyOperationsReportingEntry,
} from "@/redux/slice/company/operations-reporting/company-operations-reporting";
import {
  clearCompanyOperationsReportingError,
  resetCompanyOperationsReportingEntries,
  resetCompanyOperationsReportingFields,
  selectCompanyOperationsReporting,
  setCompanyOperationsReportingEstate,
} from "@/redux/slice/company/operations-reporting/company-operations-reporting-slice";
import type { AppDispatch } from "@/redux/store";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "@/app/dashboard/company/asset/lib/estate";
import Loader from "@/components/ui/Loader";

type EstateSelectOption = { label: string; value: string };

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function entryInDateRange(
  entry: CompanyOperationsReportingEntry,
  startIso?: string,
  endIso?: string,
): boolean {
  if (!startIso && !endIso) return true;
  const sortMs = getEntrySortDate(entry);
  if (!sortMs) return !startIso && !endIso;
  const dayStart = startIso ? new Date(startIso).getTime() : -Infinity;
  const dayEnd = endIso
    ? new Date(endIso).getTime() + 24 * 60 * 60 * 1000 - 1
    : Infinity;
  return sortMs >= dayStart && sortMs <= dayEnd;
}

export default function CompanyOperationsReportsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    types,
    fields,
    entries,
    getTypesStatus,
    getFieldsStatus,
    getEntriesStatus,
    error,
  } = useSelector(selectCompanyOperationsReporting);

  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);

  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const estateId = selectedEstate?.value ?? "";
  const estateName = selectedEstate?.label ?? "Estate";

  const selectedType = types.find((t) => getId(t) === selectedTypeId);
  const selectedField = fields.find((f) => getId(f) === selectedFieldId);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);
        if (!company) {
          toast.warning("No company linked to your account.");
          setEstatesLoading(false);
          return;
        }
        setCompanyName(company.name);

        let options: EstateOption[] = [];
        try {
          const res = await dispatch(
            getCompanyEstates({ page: 1, limit: 200 }),
          ).unwrap();
          options = mapCompanyEstateRows(res?.data);
        } catch {
          toast.error("Failed to fetch company estates.");
        }
        if (!options.length) options = parseCompanyEstates(data);

        setEstates(options);
        if (options.length) {
          setSelectedEstate({ label: options[0].name, value: options[0].id });
        }
      } catch {
        toast.error("Failed to load company information.");
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  const estateOptions = useMemo<EstateSelectOption[]>(
    () => estates.map((e) => ({ label: e.name, value: e.id })),
    [estates],
  );

  useEffect(() => {
    if (!estateId) return;
    dispatch(setCompanyOperationsReportingEstate(estateId));
    setSelectedTypeId("");
    setSelectedFieldId("");
    dispatch(fetchCompanyOperationsReportingTypes(estateId))
      .unwrap()
      .catch(() => toast.error("Failed to load reporting types."));
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!types.length) {
      setSelectedTypeId("");
      return;
    }
    setSelectedTypeId((prev) => {
      if (prev && types.some((t) => getId(t) === prev)) return prev;
      return getId(types[0]) ?? "";
    });
  }, [types]);

  useEffect(() => {
    if (!selectedTypeId) {
      dispatch(resetCompanyOperationsReportingFields());
      setSelectedFieldId("");
      return;
    }
    dispatch(resetCompanyOperationsReportingFields());
    setSelectedFieldId("");
    dispatch(fetchCompanyOperationsReportingFields(selectedTypeId))
      .unwrap()
      .catch(() => toast.error("Failed to load report sections."));
  }, [dispatch, selectedTypeId]);

  useEffect(() => {
    if (!fields.length) {
      setSelectedFieldId("");
      return;
    }
    setSelectedFieldId((prev) => {
      if (prev && fields.some((f) => getId(f) === prev)) return prev;
      return getId(fields[0]) ?? "";
    });
  }, [fields]);

  useEffect(() => {
    if (!selectedFieldId) {
      dispatch(resetCompanyOperationsReportingEntries());
      return;
    }
    dispatch(fetchCompanyOperationsReportingEntries(selectedFieldId))
      .unwrap()
      .catch(() => toast.error("Failed to load report entries."));
  }, [dispatch, selectedFieldId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCompanyOperationsReportingError());
    }
  }, [error, dispatch]);

  const filteredEntries = useMemo(() => {
    const startIso = toIsoIfPresent(startDate);
    const endIso = toIsoIfPresent(endDate);
    const q = search.trim().toLowerCase();

    return [...entries]
      .filter((entry) => entryInDateRange(entry, startIso, endIso))
      .filter((entry) => {
        if (!q) return true;
        const data = entry.data ?? {};
        const haystack = [
          ...Object.values(data).map((v) => String(v ?? "")),
          entry.createdAt ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => getEntrySortDate(b) - getEntrySortDate(a));
  }, [entries, startDate, endDate, search]);

  const pageLoading =
    estatesLoading ||
    getTypesStatus === "isLoading" ||
    getFieldsStatus === "isLoading" ||
    getEntriesStatus === "isLoading";

  const cardSubtitle =
    selectedType?.description?.trim() ||
    selectedField?.label ||
    undefined;

  const fieldLabel = selectedField?.label ?? "Operations report";

  return (
    <div className="relative">
      {pageLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading operations reports..." />
        </div>
      )}

      <div
        className={`space-y-6${pageLoading ? " blur-sm opacity-60 pointer-events-none select-none" : ""}`}
      >
        <div className="flex flex-col flex-wrap gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Operations Reporting</h1>
            <p className="mt-1 text-muted-foreground">
              Review operations reports submitted across estates under{" "}
              <span className="text-[18px] font-bold uppercase text-black underline">
                {companyName}
              </span>
              .
            </p>
          </div>

          <div className="w-48 min-w-[12rem]">
            <Select
              options={estateOptions}
              placeholder="Filter by estate"
              value={selectedEstate}
              onChange={(option) =>
                setSelectedEstate(option as EstateSelectOption | null)
              }
              isSearchable
              isDisabled={!estateOptions.length}
              styles={{
                control: (base) => ({ ...base, cursor: "pointer" }),
                option: (base) => ({ ...base, cursor: "pointer" }),
                dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
                clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
              }}
            />
          </div>
        </div>

        {!estatesLoading && !estates.length ? (
          <p className="text-sm text-muted-foreground">
            No estates linked to your company yet.
          </p>
        ) : !estateId ? (
          <p className="rounded-lg border border-border bg-muted/20 py-10 text-center text-muted-foreground">
            Select an estate to view operations reports.
          </p>
        ) : (
          <>
            <CompanyOperationsReportsFiltersBar
              types={types}
              fields={fields}
              selectedTypeId={selectedTypeId}
              selectedFieldId={selectedFieldId}
              startDate={startDate}
              endDate={endDate}
              search={search}
              typesLoading={getTypesStatus === "isLoading"}
              fieldsLoading={getFieldsStatus === "isLoading"}
              onTypeChange={setSelectedTypeId}
              onFieldChange={setSelectedFieldId}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onResetDates={() => {
                setStartDate("");
                setEndDate("");
              }}
              onSearchChange={setSearch}
            />

            {!selectedFieldId ? (
              <p className="rounded-lg border border-border bg-muted/20 py-10 text-center text-muted-foreground">
                {getTypesStatus === "succeeded" && !types.length
                  ? "No reporting types configured for this estate."
                  : "Select a reporting type and section to view entries."}
              </p>
            ) : getEntriesStatus === "succeeded" && filteredEntries.length === 0 ? (
              <p className="rounded-lg border border-border bg-muted/20 py-10 text-center text-muted-foreground">
                No report entries match your filters.
              </p>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredEntries.length}{" "}
                  {filteredEntries.length === 1 ? "entry" : "entries"} for{" "}
                  <span className="font-semibold text-foreground">{estateName}</span>
                  {selectedType?.name ? (
                    <>
                      {" "}
                      · <span className="capitalize">{selectedType.name}</span>
                    </>
                  ) : null}
                </p>

                {filteredEntries.map((entry) => {
                  const id = getId(entry);
                  return (
                    <CompanyOperationsReportEntryCard
                      key={id || JSON.stringify(entry.data)}
                      entry={entry}
                      fieldLabel={fieldLabel}
                      subtitle={cardSubtitle}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
