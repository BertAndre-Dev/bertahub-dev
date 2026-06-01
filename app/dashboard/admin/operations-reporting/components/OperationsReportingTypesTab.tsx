"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteModal from "@/components/resident/delete-modal/page";
import { labelToReportingFieldKey } from "@/lib/operations-reporting-field-key";
import type { AppDispatch } from "@/redux/store";
import {
  createOperationsReportingField,
  deleteOperationsReportingField,
  getOperationsReportingFields,
  getOperationsReportingTypes,
  updateOperationsReportingField,
  type OperationsReportingField,
  type OperationsReportingType,
} from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";
import { selectAdminOperationsReporting } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting-slice";
import Pagination from "@/components/pagination/page";
import {
  OPERATIONS_REPORT_TYPES_PAGE_SIZE,
  toPaginationInfo,
} from "@/lib/operations-reporting-pagination";
import OperationsReportingTypeCard from "./OperationsReportingTypeCard";
import OperationsReportingFieldFormModal from "./OperationsReportingFieldFormModal";
import OperationsReportingConfigureFieldsModal from "./OperationsReportingConfigureFieldsModal";

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

type Props = {
  estateId: string;
  onEditType: (type: OperationsReportingType) => void;
  onDeleteType: (type: OperationsReportingType) => void;
};

export default function OperationsReportingTypesTab({
  estateId,
  onEditType,
  onDeleteType,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [typesPage, setTypesPage] = useState(1);
  const [expandedTypeId, setExpandedTypeId] = useState("");
  const [fieldsByType, setFieldsByType] = useState<
    Record<string, OperationsReportingField[]>
  >({});
  const [fieldsLoadingByType, setFieldsLoadingByType] = useState<
    Record<string, boolean>
  >({});
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [configureTypeId, setConfigureTypeId] = useState("");
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<OperationsReportingField | null>(
    null,
  );
  const [fieldToDelete, setFieldToDelete] = useState<OperationsReportingField | null>(
    null,
  );

  const {
    types,
    typesPagination,
    getTypesStatus,
    createFieldStatus,
    updateFieldStatus,
    deleteFieldStatus,
  } = useSelector(selectAdminOperationsReporting);

  const configureType = types.find((t) => getId(t) === configureTypeId) ?? null;

  const loadTypes = useCallback(
    async (page = typesPage) => {
      if (!estateId) return;
      await dispatch(
        getOperationsReportingTypes({
          estateId,
          page,
          limit: OPERATIONS_REPORT_TYPES_PAGE_SIZE,
        }),
      ).unwrap();
    },
    [dispatch, estateId, typesPage],
  );

  useEffect(() => {
    setTypesPage(1);
    setExpandedTypeId("");
  }, [estateId]);

  useEffect(() => {
    loadTypes(typesPage).catch(() => toast.error("Failed to load reporting types."));
  }, [loadTypes, typesPage]);

  const loadFieldsForType = useCallback(
    async (typeId: string) => {
      if (!typeId) return;
      setFieldsLoadingByType((prev) => ({ ...prev, [typeId]: true }));
      try {
        const res = await dispatch(
          getOperationsReportingFields({ typeId, page: 1, limit: 50 }),
        ).unwrap();
        setFieldsByType((prev) => ({
          ...prev,
          [typeId]: res?.data ?? [],
        }));
      } catch {
        toast.error("Failed to load report fields.");
        setFieldsByType((prev) => ({ ...prev, [typeId]: [] }));
      } finally {
        setFieldsLoadingByType((prev) => ({ ...prev, [typeId]: false }));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (expandedTypeId) {
      void loadFieldsForType(expandedTypeId);
    }
  }, [expandedTypeId, loadFieldsForType]);

  const handleToggle = (typeId: string) => {
    setExpandedTypeId((prev) => (prev === typeId ? "" : typeId));
  };

  const handleConfigureFieldsSave = async (
    fields: { label: string; key: string }[],
  ) => {
    if (!estateId || !configureTypeId) return;
    try {
      for (const field of fields) {
        await dispatch(
          createOperationsReportingField({
            estateId,
            typeId: configureTypeId,
            label: field.label,
            key: field.key,
          }),
        ).unwrap();
      }
      toast.success(
        fields.length === 1
          ? "Field added."
          : `${fields.length} fields added.`,
      );
      setConfigureModalOpen(false);
      await loadFieldsForType(configureTypeId);
      if (expandedTypeId !== configureTypeId) setExpandedTypeId(configureTypeId);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to save report fields.",
      );
    }
  };

  const handleFieldSubmit = async (payload: { label: string; key: string }) => {
    const typeId = configureTypeId || expandedTypeId;
    if (!estateId || !typeId) {
      toast.info("Select a report type first.");
      return;
    }
    const trimmedLabel = payload.label.trim();
    const key = payload.key.trim() || labelToReportingFieldKey(trimmedLabel);
    try {
      if (editingField) {
        const id = getId(editingField);
        if (!id) return;
        await dispatch(
          updateOperationsReportingField({
            fieldId: id,
            label: trimmedLabel,
            key,
          }),
        ).unwrap();
        toast.success("Report field updated.");
      }
      setFieldModalOpen(false);
      setEditingField(null);
      await loadFieldsForType(typeId);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to save report field.",
      );
    }
  };

  const typesLoading = getTypesStatus === "isLoading";

  const typesPaginationInfo = toPaginationInfo(typesPagination, {
    page: typesPage,
    pageSize: OPERATIONS_REPORT_TYPES_PAGE_SIZE,
    total: types.length,
  });

  const handleTypesPageChange = (page: number) => {
    setTypesPage(page);
    setExpandedTypeId("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      {typesLoading ? (
        <div className="rounded-xl border border-border bg-muted/30 py-16 text-center text-muted-foreground">
          Loading reporting types...
        </div>
      ) : types.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 py-16 text-center text-muted-foreground">
          No fields created
        </div>
      ) : (
        <div className="space-y-4">
          {types.map((type) => {
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
                onEdit={() => onEditType(type)}
                onDelete={() => onDeleteType(type)}
              >
                {fieldsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading fields...</p>
                ) : fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No fields for this type yet. Use + Create Type to add fields.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field) => (
                      <div
                        key={getId(field)}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {field.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#0150AC]"
                            onClick={() => {
                              setConfigureTypeId(typeId);
                              setEditingField(field);
                              setFieldModalOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            disabled={deleteFieldStatus === "isLoading"}
                            onClick={() => setFieldToDelete(field)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      <OperationsReportingConfigureFieldsModal
        visible={configureModalOpen}
        onClose={() => {
          setConfigureModalOpen(false);
          setConfigureTypeId("");
        }}
        typeName={configureType?.name ?? ""}
        typeDescription={configureType?.description}
        existingFields={fieldsByType[configureTypeId] ?? []}
        loading={createFieldStatus === "isLoading"}
        submitLabel="Save"
        onSubmit={handleConfigureFieldsSave}
      />

      <OperationsReportingFieldFormModal
        visible={fieldModalOpen}
        onClose={() => {
          setFieldModalOpen(false);
          setEditingField(null);
        }}
        initial={editingField}
        loading={updateFieldStatus === "isLoading"}
        onSubmit={handleFieldSubmit}
      />

      <DeleteModal
        visible={!!fieldToDelete}
        onClose={() => setFieldToDelete(null)}
        itemName={fieldToDelete?.label ?? "this field"}
        title="Delete report field"
        loading={deleteFieldStatus === "isLoading"}
        onConfirm={async () => {
          const id = getId(fieldToDelete ?? undefined);
          const typeId = expandedTypeId || configureTypeId;
          if (!id || !typeId) return;
          await dispatch(deleteOperationsReportingField(id)).unwrap();
          toast.success("Report field deleted.");
          setFieldToDelete(null);
          await loadFieldsForType(typeId);
        }}
      />
    </div>
  );
}
