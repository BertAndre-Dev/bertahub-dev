"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Pencil, Trash2 } from "lucide-react";
import Table from "@/components/tables/list/page";
import { Button } from "@/components/ui/button";
import DeleteModal from "@/components/resident/delete-modal/page";
import type { AppDispatch } from "@/redux/store";
import {
  createOperationsReportingEntry,
  deleteOperationsReportingEntry,
  getOperationsReportingEntries,
  getOperationsReportingFields,
  getOperationsReportingTypes,
  updateOperationsReportingEntry,
  type OperationsReportingEntry,
} from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";
import { selectAdminOperationsReporting } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting-slice";
import OperationsReportingEntryFormModal from "./OperationsReportingEntryFormModal";

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

type Props = {
  estateId: string;
};

type EntryRow = OperationsReportingEntry & Record<string, unknown>;

export default function OperationsReportingReportsTab({ estateId }: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [reportFields, setReportFields] = useState<
    { id: string; label: string; key: string }[]
  >([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OperationsReportingEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<OperationsReportingEntry | null>(
    null,
  );

  const {
    types,
    entries,
    getTypesStatus,
    getEntriesStatus,
    createEntryStatus,
    updateEntryStatus,
    deleteEntryStatus,
  } = useSelector(selectAdminOperationsReporting);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getOperationsReportingTypes(estateId))
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
          getOperationsReportingFields(selectedTypeId),
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
    dispatch(getOperationsReportingEntries(selectedFieldId))
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

  const selectedFieldMeta = reportFields.find((f) => f.id === selectedFieldId);

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
      {
        key: "actions",
        header: "Actions",
        exportable: false,
        render: (item: EntryRow) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(item);
                setModalOpen(true);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive"
              disabled={deleteEntryStatus === "isLoading"}
              onClick={(e) => {
                e.stopPropagation();
                setEntryToDelete(item);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [dataKeys, deleteEntryStatus],
  );

  const selectedFieldLabel =
    reportFields.find((f) => f.id === selectedFieldId)?.label ?? "Report";

  const handleEntrySubmit = async (data: Record<string, unknown>) => {
    if (!selectedFieldId) {
      toast.info("Select a report field first.");
      return;
    }
    try {
      if (editing) {
        const id = getId(editing);
        if (!id) return;
        await dispatch(
          updateOperationsReportingEntry({ entryId: id, data }),
        ).unwrap();
        toast.success("Report entry updated.");
      } else {
        await dispatch(
          createOperationsReportingEntry({ fieldId: selectedFieldId, data }),
        ).unwrap();
        toast.success("Report entry created.");
      }
      setModalOpen(false);
      setEditing(null);
      await dispatch(getOperationsReportingEntries(selectedFieldId)).unwrap();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to save report entry.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Operations reports</h2>
          <p className="text-muted-foreground text-sm">
            Record and review operational data by type and field.
          </p>
        </div>
        <Button
          onClick={() => {
            if (!selectedFieldId) {
              toast.info("Select a type and field first.");
              return;
            }
            setEditing(null);
            setModalOpen(true);
          }}
          disabled={!selectedFieldId}
          className="shrink-0 text-white"
          style={{ backgroundColor: "#0150AC" }}
        >
          + Add entry
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1 min-w-[200px]">
          <label htmlFor="ops-report-type" className="text-sm font-medium">
            Reporting type
          </label>
          <select
            id="ops-report-type"
            className="h-10 w-full cursor-pointer rounded-md border border-border bg-background px-3 text-sm"
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            disabled={getTypesStatus === "isLoading"}
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
          <label htmlFor="ops-report-field" className="text-sm font-medium">
            Report field
          </label>
          <select
            id="ops-report-field"
            className="h-10 w-full cursor-pointer rounded-md border border-border bg-background px-3 text-sm"
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            disabled={!selectedTypeId || fieldsLoading}
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
          !selectedFieldId
            ? "Select a reporting type and field to view entries."
            : getEntriesStatus === "isLoading"
              ? "Loading report entries..."
              : "No entries yet for this field."
        }
        enableExport
        exportFileName="operations-reports"
        onExportRequest={() => Promise.resolve(tableRows)}
      />

      <OperationsReportingEntryFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        fieldLabel={selectedFieldLabel}
        fieldKey={selectedFieldMeta?.key}
        initial={editing}
        loading={
          createEntryStatus === "isLoading" || updateEntryStatus === "isLoading"
        }
        onSubmit={handleEntrySubmit}
      />

      <DeleteModal
        visible={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        itemName="this report entry"
        title="Delete report entry"
        loading={deleteEntryStatus === "isLoading"}
        onConfirm={async () => {
          const id = getId(entryToDelete ?? undefined);
          if (!id || !selectedFieldId) return;
          await dispatch(deleteOperationsReportingEntry(id)).unwrap();
          toast.success("Report entry deleted.");
          setEntryToDelete(null);
          await dispatch(getOperationsReportingEntries(selectedFieldId)).unwrap();
        }}
      />
    </div>
  );
}
