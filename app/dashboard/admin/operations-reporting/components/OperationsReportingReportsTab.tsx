"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Pencil, Trash2 } from "lucide-react";
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
  type OperationsReportingField,
  type OperationsReportingType,
} from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";
import { selectAdminOperationsReporting } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting-slice";
import {
  buildEntryDisplayRows,
  formatEntryValue,
  getEntrySortDate,
  humanizeFieldKey,
} from "@/components/dashboard/company/operations/lib/format-entry";
import OperationsReportingTypeCard from "./OperationsReportingTypeCard";
import OperationsReportingCardFilters from "./OperationsReportingCardFilters";
import OperationsReportingEntryFormModal from "./OperationsReportingEntryFormModal";

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

type CardFilterState = {
  fieldId: string;
  startDate: string;
  endDate: string;
  search: string;
};

const defaultCardFilters = (): CardFilterState => ({
  fieldId: "",
  startDate: "",
  endDate: "",
  search: "",
});

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function entryInDateRange(
  entry: OperationsReportingEntry,
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

type Props = {
  estateId: string;
  onEditType: (type: OperationsReportingType) => void;
  onDeleteType: (type: OperationsReportingType) => void;
};

export default function OperationsReportingReportsTab({
  estateId,
  onEditType,
  onDeleteType,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [expandedTypeId, setExpandedTypeId] = useState("");
  const [fieldsByType, setFieldsByType] = useState<
    Record<string, OperationsReportingField[]>
  >({});
  const [fieldsLoadingByType, setFieldsLoadingByType] = useState<
    Record<string, boolean>
  >({});
  const [entriesByField, setEntriesByField] = useState<
    Record<string, OperationsReportingEntry[]>
  >({});
  const [entriesLoadingByField, setEntriesLoadingByField] = useState<
    Record<string, boolean>
  >({});
  const [filtersByType, setFiltersByType] = useState<
    Record<string, CardFilterState>
  >({});
  const [modalOpen, setModalOpen] = useState(false);
  const [fillTypeId, setFillTypeId] = useState("");
  const [fillFieldId, setFillFieldId] = useState("");
  const [editing, setEditing] = useState<OperationsReportingEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<OperationsReportingEntry | null>(
    null,
  );

  const {
    types,
    getTypesStatus,
    createEntryStatus,
    updateEntryStatus,
    deleteEntryStatus,
  } = useSelector(selectAdminOperationsReporting);

  const loadTypes = useCallback(async () => {
    if (!estateId) return;
    await dispatch(getOperationsReportingTypes(estateId)).unwrap();
  }, [dispatch, estateId]);

  useEffect(() => {
    loadTypes().catch(() => toast.error("Failed to load reporting types."));
  }, [loadTypes]);

  const getFilters = (typeId: string): CardFilterState =>
    filtersByType[typeId] ?? defaultCardFilters();

  const setFilters = (typeId: string, patch: Partial<CardFilterState>) => {
    setFiltersByType((prev) => ({
      ...prev,
      [typeId]: { ...defaultCardFilters(), ...prev[typeId], ...patch },
    }));
  };

  const loadFieldsForType = useCallback(
    async (typeId: string) => {
      if (!typeId) return [];
      setFieldsLoadingByType((prev) => ({ ...prev, [typeId]: true }));
      try {
        const res = await dispatch(getOperationsReportingFields(typeId)).unwrap();
        const list = res?.data ?? [];
        setFieldsByType((prev) => ({ ...prev, [typeId]: list }));
        const firstFieldId = getId(list[0]);
        setFiltersByType((prev) => {
          const current = prev[typeId];
          if (current?.fieldId && list.some((f) => getId(f) === current.fieldId)) {
            return prev;
          }
          return {
            ...prev,
            [typeId]: { ...defaultCardFilters(), ...current, fieldId: firstFieldId },
          };
        });
        return list;
      } catch {
        toast.error("Failed to load report fields.");
        setFieldsByType((prev) => ({ ...prev, [typeId]: [] }));
        return [];
      } finally {
        setFieldsLoadingByType((prev) => ({ ...prev, [typeId]: false }));
      }
    },
    [dispatch],
  );

  const loadEntriesForField = useCallback(
    async (fieldId: string) => {
      if (!fieldId) return;
      setEntriesLoadingByField((prev) => ({ ...prev, [fieldId]: true }));
      try {
        const res = await dispatch(getOperationsReportingEntries(fieldId)).unwrap();
        setEntriesByField((prev) => ({ ...prev, [fieldId]: res?.data ?? [] }));
      } catch {
        toast.error("Failed to load report entries.");
        setEntriesByField((prev) => ({ ...prev, [fieldId]: [] }));
      } finally {
        setEntriesLoadingByField((prev) => ({ ...prev, [fieldId]: false }));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!expandedTypeId) return;
    void loadFieldsForType(expandedTypeId);
  }, [expandedTypeId, loadFieldsForType]);

  const expandedFieldId = expandedTypeId
    ? filtersByType[expandedTypeId]?.fieldId
    : undefined;

  useEffect(() => {
    if (expandedFieldId) void loadEntriesForField(expandedFieldId);
  }, [expandedFieldId, loadEntriesForField]);

  const handleToggle = (typeId: string) => {
    setExpandedTypeId((prev) => (prev === typeId ? "" : typeId));
  };

  const filteredEntries = useCallback(
    (fieldId: string, filters: CardFilterState) => {
      const entries = entriesByField[fieldId] ?? [];
      const startIso = toIsoIfPresent(filters.startDate);
      const endIso = toIsoIfPresent(filters.endDate);
      const q = filters.search.trim().toLowerCase();

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
    },
    [entriesByField],
  );

  const selectedFieldMeta = useMemo(() => {
    if (!fillTypeId || !fillFieldId) return null;
    const fields = fieldsByType[fillTypeId] ?? [];
    return fields.find((f) => getId(f) === fillFieldId) ?? null;
  }, [fieldsByType, fillTypeId, fillFieldId]);

  const handleEntrySubmit = async (data: Record<string, unknown>) => {
    const fieldId = fillFieldId || (expandedTypeId && getFilters(expandedTypeId).fieldId);
    if (!fieldId) {
      toast.info("Select a report section first.");
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
          createOperationsReportingEntry({ fieldId, data }),
        ).unwrap();
        toast.success("Report entry created.");
      }
      setModalOpen(false);
      setEditing(null);
      await loadEntriesForField(fieldId);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to save report entry.",
      );
    }
  };

  const typesLoading = getTypesStatus === "isLoading";

  return (
    <div className="space-y-4">
      {typesLoading ? (
        <div className="rounded-xl border border-border bg-muted/30 py-16 text-center text-muted-foreground">
          Loading reporting types...
        </div>
      ) : types.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 py-16 text-center text-muted-foreground">
          No report types yet. Create a type to start filling reports.
        </div>
      ) : (
        <div className="space-y-4">
          {types.map((type: OperationsReportingType) => {
            const typeId = getId(type);
            const expanded = expandedTypeId === typeId;
            const fields = fieldsByType[typeId] ?? [];
            const fieldsLoading = fieldsLoadingByType[typeId];
            const filters = getFilters(typeId);
            const fieldId = filters.fieldId;
            const entries = fieldId ? filteredEntries(fieldId, filters) : [];
            const entriesLoading = fieldId ? entriesLoadingByField[fieldId] : false;
            const selectedField = fields.find((f) => getId(f) === fieldId);

            return (
              <OperationsReportingTypeCard
                key={typeId}
                title={type.name}
                description={type.description}
                expanded={expanded}
                onToggle={() => handleToggle(typeId)}
                onEdit={() => onEditType(type)}
                onDelete={() => onDeleteType(type)}
              >
                <OperationsReportingCardFilters
                  fields={fields}
                  selectedFieldId={fieldId}
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  search={filters.search}
                  fieldsLoading={fieldsLoading}
                  onFieldChange={(nextFieldId) => {
                    setFilters(typeId, { fieldId: nextFieldId });
                    if (nextFieldId) void loadEntriesForField(nextFieldId);
                  }}
                  onStartDateChange={(v) => setFilters(typeId, { startDate: v })}
                  onEndDateChange={(v) => setFilters(typeId, { endDate: v })}
                  onResetDates={() =>
                    setFilters(typeId, { startDate: "", endDate: "" })
                  }
                  onSearchChange={(v) => setFilters(typeId, { search: v })}
                />

                {!fieldId ? (
                  <p className="text-sm text-muted-foreground">
                    {fieldsLoading
                      ? "Loading sections..."
                      : fields.length
                        ? "Select a report section to view entries."
                        : "No sections configured for this type."}
                  </p>
                ) : entriesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading entries...</p>
                ) : entries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No entries match your filters.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {entries.map((entry) => {
                      const entryId = getId(entry);
                      const data = entry.data ?? {};
                      const rows = buildEntryDisplayRows(data);
                      const reportDate = data.date;

                      return (
                        <div
                          key={entryId || JSON.stringify(data)}
                          className="rounded-lg border border-border bg-muted/10 p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground">
                                {selectedField?.label ?? "Report entry"}
                              </p>
                              {reportDate != null && reportDate !== "" ? (
                                <p className="text-xs text-muted-foreground">
                                  {formatEntryValue("date", reportDate)}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#0150AC]"
                                onClick={() => {
                                  setFillTypeId(typeId);
                                  setFillFieldId(fieldId);
                                  setEditing(entry);
                                  setModalOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                disabled={deleteEntryStatus === "isLoading"}
                                onClick={() => setEntryToDelete(entry)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {rows.flatMap((row) =>
                              row.keys.map((key) => (
                                <div key={key} className="min-w-0 space-y-0.5">
                                  <p className="text-xs text-muted-foreground">
                                    {humanizeFieldKey(key)}
                                  </p>
                                  <p className="text-sm font-medium text-foreground">
                                    {formatEntryValue(key, data[key])}
                                  </p>
                                </div>
                              )),
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </OperationsReportingTypeCard>
            );
          })}
        </div>
      )}

      <OperationsReportingEntryFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        fieldLabel={selectedFieldMeta?.label ?? "Report"}
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
          const fieldId =
            fillFieldId ||
            (expandedTypeId ? getFilters(expandedTypeId).fieldId : "");
          if (!id || !fieldId) return;
          await dispatch(deleteOperationsReportingEntry(id)).unwrap();
          toast.success("Report entry deleted.");
          setEntryToDelete(null);
          await loadEntriesForField(fieldId);
        }}
      />
    </div>
  );
}
