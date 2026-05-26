"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Table from "@/components/tables/list/page";
import type { AppDispatch } from "@/redux/store";
import {
  getCompanyOperationsReportingEntries,
  getCompanyOperationsReportingFields,
  getCompanyOperationsReportingTypes,
  type CompanyOperationsReportingEntry,
} from "@/redux/slice/company/operations-reporting/company-operations-reporting";
import { selectCompanyOperationsReporting } from "@/redux/slice/company/operations-reporting/company-operations-reporting-slice";

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

type Props = {
  estateId: string;
};

type EntryRow = CompanyOperationsReportingEntry & Record<string, unknown>;

export default function CompanyOperationsReportsTable({ estateId }: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [reportFields, setReportFields] = useState<
    { id: string; label: string; key: string }[]
  >([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  const { types, entries, getTypesStatus, getEntriesStatus } = useSelector(
    selectCompanyOperationsReporting,
  );

  useEffect(() => {
    setSelectedTypeId("");
    setSelectedFieldId("");
    setReportFields([]);
    if (!estateId) return;
    dispatch(getCompanyOperationsReportingTypes(estateId))
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
      setReportFields([]);
      setSelectedFieldId("");
      return;
    }
    (async () => {
      setFieldsLoading(true);
      try {
        const res = await dispatch(
          getCompanyOperationsReportingFields(selectedTypeId),
        ).unwrap();
        const list = (res?.data ?? []).map((f) => ({
          id: getId(f),
          label: f.label,
          key: f.key,
        }));
        setReportFields(list.filter((f) => f.id));
        setSelectedFieldId((prev) =>
          prev && list.some((f) => f.id === prev) ? prev : list[0]?.id ?? "",
        );
      } catch {
        setReportFields([]);
        setSelectedFieldId("");
        toast.error("Failed to load report fields.");
      } finally {
        setFieldsLoading(false);
      }
    })();
  }, [dispatch, selectedTypeId]);

  useEffect(() => {
    if (!selectedFieldId) return;
    dispatch(getCompanyOperationsReportingEntries(selectedFieldId))
      .unwrap()
      .catch(() => toast.error("Failed to load report entries."));
  }, [dispatch, selectedFieldId]);

  const dataKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const entry of entries) {
      if (entry.data) {
        Object.keys(entry.data).forEach((k) => {
          if (k !== "date") keys.add(k);
        });
      }
    }
    return Array.from(keys);
  }, [entries]);

  const tableRows: EntryRow[] = useMemo(
    () =>
      entries.map((entry) => {
        const row: EntryRow = { ...entry };
        for (const key of dataKeys) {
          const val = entry.data?.[key];
          row[key] = val == null ? "—" : String(val);
        }
        return row;
      }),
    [entries, dataKeys],
  );

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Date",
        render: (item: EntryRow) => {
          const reportDate = item.data?.date;
          if (reportDate != null && reportDate !== "") {
            const d = new Date(String(reportDate));
            return Number.isNaN(d.getTime())
              ? String(reportDate)
              : d.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
          }
          return item.createdAt
            ? new Date(item.createdAt).toLocaleString()
            : "—";
        },
        exportValue: (item: EntryRow) => {
          const reportDate = item.data?.date;
          if (reportDate != null && reportDate !== "") return String(reportDate);
          return item.createdAt ? new Date(item.createdAt).toISOString() : "";
        },
      },
      ...dataKeys.map((key) => ({
        key,
        header: key.charAt(0).toUpperCase() + key.slice(1),
      })),
    ],
    [dataKeys],
  );

  return (
    <div className="space-y-4">
      {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Operations reports</h2>
          <p className="text-muted-foreground text-sm">
            Review operations data submitted by estate administrators.
          </p>
        </div>
      </div> */}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1 min-w-[200px]">
          <label htmlFor="company-ops-report-type" className="text-sm font-medium">
            Reporting type
          </label>
          <select
            id="company-ops-report-type"
            className="h-10 w-full cursor-pointer rounded-md border border-border bg-background px-3 text-sm"
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            disabled={getTypesStatus === "isLoading" || !types.length}
          >
            <option value="">Select type</option>
            {types.map((t) => {
              const id = getId(t);
              return (
                <option key={id} value={id}>
                  {t.name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-1 min-w-[200px]">
          <label htmlFor="company-ops-report-field" className="text-sm font-medium">
            Report field
          </label>
          <select
            id="company-ops-report-field"
            className="h-10 w-full cursor-pointer rounded-md border border-border bg-background px-3 text-sm"
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            disabled={!selectedTypeId || fieldsLoading || !reportFields.length}
          >
            <option value="">Select field</option>
            {reportFields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label} ({f.key})
              </option>
            ))}
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={selectedFieldId ? tableRows : []}
        emptyMessage={
          getTypesStatus === "isLoading"
            ? "Loading reporting types..."
            : !types.length
              ? "No reporting types configured for this estate yet."
              : !selectedFieldId
                ? "Select a reporting type and field to view entries."
                : getEntriesStatus === "isLoading"
                  ? "Loading report entries..."
                  : "No entries yet for this field."
        }
        enableExport
        exportFileName="company-operations-reports"
        onExportRequest={() => Promise.resolve(tableRows)}
      />
    </div>
  );
}
