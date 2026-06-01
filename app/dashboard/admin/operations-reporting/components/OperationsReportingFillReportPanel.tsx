"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
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
  fetchCompanyOperationsReportingEntries,
  fetchCompanyOperationsReportingFields,
  fetchCompanyOperationsReportingTypes,
  type CompanyOperationsReportingEntry,
  type CompanyOperationsReportingField,
  type CompanyOperationsReportingType,
} from "@/redux/slice/company/operations-reporting/company-operations-reporting";
import {
  clearCompanyOperationsReportingError,
  selectCompanyOperationsReporting,
  setCompanyOperationsReportingEstate,
} from "@/redux/slice/company/operations-reporting/company-operations-reporting-slice";
import OperationsReportingTypeCard from "./OperationsReportingTypeCard";
import OperationsReportingTypeEntriesList from "./OperationsReportingTypeEntriesList";
import OperationsReportingEntryFormModal from "./OperationsReportingEntryFormModal";

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

type ReportType = OperationsReportingType | CompanyOperationsReportingType;
type ReportField = OperationsReportingField | CompanyOperationsReportingField;
type ReportEntry = OperationsReportingEntry | CompanyOperationsReportingEntry;

type Props = {
  estateId: string;
  variant: "admin" | "company";
  readOnly?: boolean;
  fillReportTabNonce?: number;
  emptyTypesMessage?: string;
  onEditType?: (type: ReportType) => void;
  onDeleteType?: (type: ReportType) => void;
};

export default function OperationsReportingFillReportPanel({
  estateId,
  variant,
  readOnly = false,
  fillReportTabNonce = 0,
  emptyTypesMessage,
  onEditType,
  onDeleteType,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [expandedTypeId, setExpandedTypeId] = useState("");
  const [fieldsByType, setFieldsByType] = useState<Record<string, ReportField[]>>({});
  const [fieldsLoadingByType, setFieldsLoadingByType] = useState<
    Record<string, boolean>
  >({});
  const [entriesByField, setEntriesByField] = useState<Record<string, ReportEntry[]>>(
    {},
  );
  const [entriesLoadingByField, setEntriesLoadingByField] = useState<
    Record<string, boolean>
  >({});
  const [modalOpen, setModalOpen] = useState(false);
  const [fillFieldId, setFillFieldId] = useState("");
  const [editing, setEditing] = useState<ReportEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<ReportEntry | null>(null);

  const adminState = useSelector(selectAdminOperationsReporting);
  const companyState = useSelector(selectCompanyOperationsReporting);

  const types =
    variant === "admin" ? adminState.types : companyState.types;
  const getTypesStatus =
    variant === "admin" ? adminState.getTypesStatus : companyState.getTypesStatus;
  const createEntryStatus =
    variant === "admin" ? adminState.createEntryStatus : "idle";
  const updateEntryStatus =
    variant === "admin" ? adminState.updateEntryStatus : "idle";
  const deleteEntryStatus =
    variant === "admin" ? adminState.deleteEntryStatus : "idle";
  const companyError = companyState.error;

  const loadTypes = useCallback(async () => {
    if (!estateId) return;
    if (variant === "company") {
      dispatch(setCompanyOperationsReportingEstate(estateId));
    }
    setExpandedTypeId("");
    setFieldsByType({});
    setEntriesByField({});
    const action =
      variant === "admin"
        ? getOperationsReportingTypes(estateId)
        : fetchCompanyOperationsReportingTypes(estateId);
    await dispatch(action).unwrap();
  }, [dispatch, estateId, variant]);

  useEffect(() => {
    if (!estateId) return;
    loadTypes().catch(() => toast.error("Failed to load reporting types."));
  }, [loadTypes, estateId]);

  useEffect(() => {
    if (variant === "company" && companyError) {
      toast.error(companyError);
      dispatch(clearCompanyOperationsReportingError());
    }
  }, [companyError, dispatch, variant]);

  const loadEntriesForField = useCallback(
    async (fieldId: string) => {
      if (!fieldId) return;
      setEntriesLoadingByField((prev) => ({ ...prev, [fieldId]: true }));
      try {
        const action =
          variant === "admin"
            ? getOperationsReportingEntries(fieldId)
            : fetchCompanyOperationsReportingEntries(fieldId);
        const res = await dispatch(action).unwrap();
        setEntriesByField((prev) => ({ ...prev, [fieldId]: res?.data ?? [] }));
      } catch {
        toast.error("Failed to load report entries.");
        setEntriesByField((prev) => ({ ...prev, [fieldId]: [] }));
      } finally {
        setEntriesLoadingByField((prev) => ({ ...prev, [fieldId]: false }));
      }
    },
    [dispatch, variant],
  );

  const loadFieldsAndEntriesForType = useCallback(
    async (typeId: string) => {
      if (!typeId) return;
      setFieldsLoadingByType((prev) => ({ ...prev, [typeId]: true }));
      try {
        const action =
          variant === "admin"
            ? getOperationsReportingFields(typeId)
            : fetchCompanyOperationsReportingFields(typeId);
        const res = await dispatch(action).unwrap();
        const list = res?.data ?? [];
        setFieldsByType((prev) => ({ ...prev, [typeId]: list }));
        await Promise.all(
          list.map((f) => {
            const id = getId(f);
            return id ? loadEntriesForField(id) : Promise.resolve();
          }),
        );
      } catch {
        toast.error("Failed to load report fields.");
        setFieldsByType((prev) => ({ ...prev, [typeId]: [] }));
      } finally {
        setFieldsLoadingByType((prev) => ({ ...prev, [typeId]: false }));
      }
    },
    [dispatch, variant, loadEntriesForField],
  );

  useEffect(() => {
    if (!expandedTypeId) return;
    void loadFieldsAndEntriesForType(expandedTypeId);
  }, [expandedTypeId, loadFieldsAndEntriesForType]);

  useEffect(() => {
    if (readOnly || fillReportTabNonce <= 0) return;
    const fields = fieldsByType[expandedTypeId] ?? [];
    const fieldId = getId(fields[0]);
    if (!expandedTypeId || !fieldId) {
      toast.info("Expand a report type with at least one section first.");
      return;
    }
    setFillFieldId(fieldId);
    setEditing(null);
    setModalOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nonce-driven
  }, [fillReportTabNonce]);

  const handleToggle = (typeId: string) => {
    setExpandedTypeId((prev) => (prev === typeId ? "" : typeId));
  };

  const handleEntrySubmit = async (data: Record<string, unknown>) => {
    if (!fillFieldId) {
      toast.info("No report section selected.");
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
          createOperationsReportingEntry({ fieldId: fillFieldId, data }),
        ).unwrap();
        toast.success("Report entry created.");
      }
      setModalOpen(false);
      setEditing(null);
      await loadEntriesForField(fillFieldId);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to save report entry.",
      );
    }
  };

  const typesLoading = getTypesStatus === "isLoading";
  const defaultEmptyMessage =
    variant === "admin"
      ? "No report types yet. Create a type to start filling reports."
      : "No reporting types configured for this estate.";

  return (
    <div className="space-y-4">
      {typesLoading ? (
        <div className="rounded-xl border border-border bg-muted/30 py-16 text-center text-muted-foreground">
          Loading reporting types...
        </div>
      ) : types.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 py-16 text-center text-muted-foreground">
          {emptyTypesMessage ?? defaultEmptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {types.map((type: ReportType) => {
            const typeId = getId(type);
            const expanded = expandedTypeId === typeId;
            const fields = fieldsByType[typeId] ?? [];
            const fieldsLoading = fieldsLoadingByType[typeId];

            return (
              <OperationsReportingTypeCard
                key={typeId}
                title={type.name}
                description={type.description}
                expanded={expanded}
                onToggle={() => handleToggle(typeId)}
                readOnly={readOnly}
                onEdit={onEditType ? () => onEditType(type) : undefined}
                onDelete={onDeleteType ? () => onDeleteType(type) : undefined}
              >
                <OperationsReportingTypeEntriesList
                  fields={fields}
                  fieldsLoading={fieldsLoading}
                  entriesByField={entriesByField}
                  entriesLoadingByField={entriesLoadingByField}
                  deleteEntryLoading={deleteEntryStatus === "isLoading"}
                  onEditEntry={
                    readOnly
                      ? undefined
                      : (fieldId, entry) => {
                          setFillFieldId(fieldId);
                          setEditing(entry);
                          setModalOpen(true);
                        }
                  }
                  onDeleteEntry={
                    readOnly
                      ? undefined
                      : (fieldId, entry) => {
                          setFillFieldId(fieldId);
                          setEntryToDelete(entry);
                        }
                  }
                />
              </OperationsReportingTypeCard>
            );
          })}
        </div>
      )}

      {!readOnly ? (
        <>
          <OperationsReportingEntryFormModal
            visible={modalOpen && !!fillFieldId}
            onClose={() => {
              setModalOpen(false);
              setEditing(null);
              setFillFieldId("");
            }}
            fieldId={fillFieldId}
            initial={editing as OperationsReportingEntry | null}
            loading={
              createEntryStatus === "isLoading" || updateEntryStatus === "isLoading"
            }
            submitLabel="Save"
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
              if (!id || !fillFieldId) return;
              await dispatch(deleteOperationsReportingEntry(id)).unwrap();
              toast.success("Report entry deleted.");
              setEntryToDelete(null);
              await loadEntriesForField(fillFieldId);
            }}
          />
        </>
      ) : null}
    </div>
  );
}
