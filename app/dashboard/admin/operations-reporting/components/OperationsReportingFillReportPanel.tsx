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
import Pagination from "@/components/pagination/page";
import {
  OPERATIONS_REPORT_ENTRIES_PAGE_SIZE,
  OPERATIONS_REPORT_TYPES_PAGE_SIZE,
  toPaginationInfo,
  type OperationsReportingApiPagination,
} from "@/lib/operations-reporting-pagination";
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
  const [typesPage, setTypesPage] = useState(1);
  const [entriesByField, setEntriesByField] = useState<Record<string, ReportEntry[]>>(
    {},
  );
  const [entriesPaginationByField, setEntriesPaginationByField] = useState<
    Record<string, OperationsReportingApiPagination | null>
  >({});
  const [entriesLoadingByField, setEntriesLoadingByField] = useState<
    Record<string, boolean>
  >({});
  const [modalOpen, setModalOpen] = useState(false);
  const [fillTypeId, setFillTypeId] = useState("");
  const [fillTypeName, setFillTypeName] = useState("");
  const [fillTypeDescription, setFillTypeDescription] = useState<string | undefined>();
  const [fillFields, setFillFields] = useState<ReportField[]>([]);
  const [editingFieldId, setEditingFieldId] = useState("");
  const [editing, setEditing] = useState<ReportEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<ReportEntry | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState("");

  const adminState = useSelector(selectAdminOperationsReporting);
  const companyState = useSelector(selectCompanyOperationsReporting);

  const types =
    variant === "admin" ? adminState.types : companyState.types;
  const typesPagination =
    variant === "admin" ? adminState.typesPagination : companyState.typesPagination;
  const getTypesStatus =
    variant === "admin" ? adminState.getTypesStatus : companyState.getTypesStatus;
  const createEntryStatus =
    variant === "admin" ? adminState.createEntryStatus : "idle";
  const updateEntryStatus =
    variant === "admin" ? adminState.updateEntryStatus : "idle";
  const deleteEntryStatus =
    variant === "admin" ? adminState.deleteEntryStatus : "idle";
  const companyError = companyState.error;

  const loadTypes = useCallback(
    async (page = typesPage) => {
      if (!estateId) return;
      if (variant === "company") {
        dispatch(setCompanyOperationsReportingEstate(estateId));
      }
      const action =
        variant === "admin"
          ? getOperationsReportingTypes({
              estateId,
              page,
              limit: OPERATIONS_REPORT_TYPES_PAGE_SIZE,
            })
          : fetchCompanyOperationsReportingTypes({
              estateId,
              page,
              limit: OPERATIONS_REPORT_TYPES_PAGE_SIZE,
            });
      await dispatch(action).unwrap();
    },
    [dispatch, estateId, variant, typesPage],
  );

  useEffect(() => {
    if (!estateId) return;
    setTypesPage(1);
    setExpandedTypeId("");
    setFieldsByType({});
    setEntriesByField({});
    setEntriesPaginationByField({});
  }, [estateId]);

  useEffect(() => {
    if (!estateId) return;
    loadTypes(typesPage).catch(() => toast.error("Failed to load reporting types."));
  }, [estateId, typesPage, loadTypes]);

  useEffect(() => {
    if (variant === "company" && companyError) {
      toast.error(companyError);
      dispatch(clearCompanyOperationsReportingError());
    }
  }, [companyError, dispatch, variant]);

  const loadEntriesForField = useCallback(
    async (fieldId: string, page = 1) => {
      if (!fieldId) return;
      setEntriesLoadingByField((prev) => ({ ...prev, [fieldId]: true }));
      try {
        const action =
          variant === "admin"
            ? getOperationsReportingEntries({
                fieldId,
                page,
                limit: OPERATIONS_REPORT_ENTRIES_PAGE_SIZE,
              })
            : fetchCompanyOperationsReportingEntries({
                fieldId,
                page,
                limit: OPERATIONS_REPORT_ENTRIES_PAGE_SIZE,
              });
        const res = await dispatch(action).unwrap();
        setEntriesByField((prev) => ({ ...prev, [fieldId]: res?.data ?? [] }));
        setEntriesPaginationByField((prev) => ({
          ...prev,
          [fieldId]: res?.pagination ?? null,
        }));
      } catch {
        toast.error("Failed to load report entries.");
        setEntriesByField((prev) => ({ ...prev, [fieldId]: [] }));
        setEntriesPaginationByField((prev) => ({ ...prev, [fieldId]: null }));
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
            ? getOperationsReportingFields({ typeId, page: 1, limit: 50 })
            : fetchCompanyOperationsReportingFields({ typeId, page: 1, limit: 50 });
        const res = await dispatch(action).unwrap();
        const list = res?.data ?? [];
        setFieldsByType((prev) => ({ ...prev, [typeId]: list }));
        setEntriesByField((prev) => {
          const next = { ...prev };
          for (const f of list) {
            const id = getId(f);
            if (id) delete next[id];
          }
          return next;
        });
        setEntriesPaginationByField((prev) => {
          const next = { ...prev };
          for (const f of list) {
            const id = getId(f);
            if (id) delete next[id];
          }
          return next;
        });
        await Promise.all(
          list.map((f) => {
            const id = getId(f);
            return id ? loadEntriesForField(id, 1) : Promise.resolve();
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
    if (!expandedTypeId) {
      toast.info("Expand a report type first, then click Fill report.");
      return;
    }

    (async () => {
      let fields = fieldsByType[expandedTypeId] ?? [];
      if (!fields.length) {
        try {
          const action =
            variant === "admin"
              ? getOperationsReportingFields({ typeId: expandedTypeId, page: 1, limit: 50 })
              : fetchCompanyOperationsReportingFields({
                  typeId: expandedTypeId,
                  page: 1,
                  limit: 50,
                });
          const res = await dispatch(action).unwrap();
          fields = res?.data ?? [];
          setFieldsByType((prev) => ({ ...prev, [expandedTypeId]: fields }));
        } catch {
          toast.error("Failed to load report fields.");
          return;
        }
      }
      if (!fields.length) {
        toast.info("Configure at least one field for this report type.");
        return;
      }
      const type = types.find((t) => getId(t) === expandedTypeId);
      setFillTypeId(expandedTypeId);
      setFillTypeName(type?.name ?? "Report type");
      setFillTypeDescription(type?.description);
      setFillFields(fields);
      setEditingFieldId("");
      setEditing(null);
      setModalOpen(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nonce-driven
  }, [fillReportTabNonce]);

  const handleToggle = (typeId: string) => {
    setExpandedTypeId((prev) => (prev === typeId ? "" : typeId));
  };

  const handleTypesPageChange = (page: number) => {
    setTypesPage(page);
    setExpandedTypeId("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEntriesPageChange = (fieldId: string, page: number) => {
    void loadEntriesForField(fieldId, page);
  };

  const typesPaginationInfo = toPaginationInfo(typesPagination, {
    page: typesPage,
    pageSize: OPERATIONS_REPORT_TYPES_PAGE_SIZE,
    total: types.length,
  });

  const handleEntrySubmit = async (data: Record<string, unknown>) => {
    if (!fillTypeId || !fillFields.length) {
      toast.info("No report type selected.");
      return;
    }
    try {
      if (editing) {
        const id = getId(editing);
        if (!id || !editingFieldId) return;
        await dispatch(
          updateOperationsReportingEntry({ entryId: id, data }),
        ).unwrap();
        toast.success("Report entry updated.");
        setModalOpen(false);
        setEditing(null);
        setEditingFieldId("");
        const editPage = entriesPaginationByField[editingFieldId]?.page ?? 1;
        await loadEntriesForField(editingFieldId, editPage);
        return;
      }

      let created = 0;
      for (const field of fillFields) {
        const fieldId = getId(field);
        const key = field.key;
        if (!fieldId || !(key in data)) continue;
        const value = data[key];
        if (value === "" || value == null) continue;
        await dispatch(
          createOperationsReportingEntry({
            fieldId,
            data: { [key]: value },
          }),
        ).unwrap();
        created += 1;
      }

      if (created === 0) {
        toast.info("Enter at least one field value.");
        return;
      }

      toast.success(
        created === 1 ? "Report entry created." : `${created} report entries created.`,
      );
      setModalOpen(false);
      setEditing(null);
      await loadFieldsAndEntriesForType(fillTypeId);
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
                createdAt={type.createdAt}
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
                  entriesPaginationByField={entriesPaginationByField}
                  onEntriesPageChange={handleEntriesPageChange}
                  deleteEntryLoading={deleteEntryStatus === "isLoading"}
                  onEditEntry={
                    readOnly
                      ? undefined
                      : (fieldId, entry) => {
                          setFillTypeId(typeId);
                          setFillTypeName(type.name);
                          setFillTypeDescription(type.description);
                          setFillFields(fields);
                          setEditingFieldId(fieldId);
                          setEditing(entry);
                          setModalOpen(true);
                        }
                  }
                  onDeleteEntry={
                    readOnly
                      ? undefined
                      : (fieldId, entry) => {
                          setDeleteFieldId(fieldId);
                          setEntryToDelete(entry);
                        }
                  }
                />
              </OperationsReportingTypeCard>
            );
          })}
        </div>
      )}

      {!typesLoading && typesPaginationInfo.total > 0 ? (
        <Pagination
          paginationInfo={typesPaginationInfo}
          onPageChange={handleTypesPageChange}
          disabled={typesLoading}
          itemLabel="report types"
        />
      ) : null}

      {!readOnly ? (
        <>
          <OperationsReportingEntryFormModal
            visible={modalOpen && !!fillTypeId && fillFields.length > 0}
            onClose={() => {
              setModalOpen(false);
              setEditing(null);
              setEditingFieldId("");
              setFillTypeId("");
              setFillFields([]);
            }}
            typeName={fillTypeName}
            typeDescription={fillTypeDescription}
            fields={fillFields}
            initial={editing as OperationsReportingEntry | null}
            loading={
              createEntryStatus === "isLoading" || updateEntryStatus === "isLoading"
            }
            submitLabel="Save"
            onSubmit={handleEntrySubmit}
          />

          <DeleteModal
            visible={!!entryToDelete}
            onClose={() => {
              setEntryToDelete(null);
              setDeleteFieldId("");
            }}
            itemName="this report entry"
            title="Delete report entry"
            loading={deleteEntryStatus === "isLoading"}
            onConfirm={async () => {
              const id = getId(entryToDelete ?? undefined);
              const fieldId = deleteFieldId;
              if (!id || !fieldId) return;
              await dispatch(deleteOperationsReportingEntry(id)).unwrap();
              toast.success("Report entry deleted.");
              setEntryToDelete(null);
              const page = entriesPaginationByField[fieldId]?.page ?? 1;
              await loadEntriesForField(fieldId, page);
              setDeleteFieldId("");
            }}
          />
        </>
      ) : null}
    </div>
  );
}
