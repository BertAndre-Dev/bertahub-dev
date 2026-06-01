"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DeleteModal from "@/components/resident/delete-modal/page";
import type { AppDispatch } from "@/redux/store";
import {
  createOperationsReportingField,
  deleteOperationsReportingField,
  deleteOperationsReportingType,
  getOperationsReportingFields,
  getOperationsReportingTypes,
  updateOperationsReportingField,
  type OperationsReportingField,
  type OperationsReportingType,
} from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";
import { selectAdminOperationsReporting } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting-slice";
import OperationsReportingTypeCard from "./OperationsReportingTypeCard";
import OperationsReportingFieldFormModal from "./OperationsReportingFieldFormModal";

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

type Props = {
  estateId: string;
  configureNonce: number;
  onEditType: (type: OperationsReportingType) => void;
  onDeleteType: (type: OperationsReportingType) => void;
};

export default function OperationsReportingTypesTab({
  estateId,
  configureNonce,
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
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [configureTypeId, setConfigureTypeId] = useState("");
  const [editingField, setEditingField] = useState<OperationsReportingField | null>(
    null,
  );
  const [fieldToDelete, setFieldToDelete] = useState<OperationsReportingField | null>(
    null,
  );

  const {
    types,
    getTypesStatus,
    createFieldStatus,
    updateFieldStatus,
    deleteFieldStatus,
  } = useSelector(selectAdminOperationsReporting);

  const loadTypes = useCallback(async () => {
    if (!estateId) return;
    await dispatch(getOperationsReportingTypes(estateId)).unwrap();
  }, [dispatch, estateId]);

  useEffect(() => {
    loadTypes().catch(() => toast.error("Failed to load reporting types."));
  }, [loadTypes]);

  const loadFieldsForType = useCallback(
    async (typeId: string) => {
      if (!typeId) return;
      setFieldsLoadingByType((prev) => ({ ...prev, [typeId]: true }));
      try {
        const res = await dispatch(getOperationsReportingFields(typeId)).unwrap();
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

  useEffect(() => {
    if (configureNonce <= 0) return;
    if (!expandedTypeId) {
      toast.info("Expand a report type first, then click Configure.");
      return;
    }
    setConfigureTypeId(expandedTypeId);
    setEditingField(null);
    setFieldModalOpen(true);
  }, [configureNonce, expandedTypeId]);

  const handleToggle = (typeId: string) => {
    setExpandedTypeId((prev) => (prev === typeId ? "" : typeId));
  };

  const handleFieldSubmit = async (payload: { label: string; key: string }) => {
    const typeId = configureTypeId || expandedTypeId;
    if (!estateId || !typeId) {
      toast.info("Select a report type first.");
      return;
    }
    try {
      if (editingField) {
        const id = getId(editingField);
        if (!id) return;
        await dispatch(
          updateOperationsReportingField({
            fieldId: id,
            label: payload.label,
            key: payload.key,
          }),
        ).unwrap();
        toast.success("Report field updated.");
      } else {
        await dispatch(
          createOperationsReportingField({
            estateId,
            typeId,
            label: payload.label,
            key: payload.key,
          }),
        ).unwrap();
        toast.success("Report field created.");
      }
      setFieldModalOpen(false);
      setEditingField(null);
      await loadFieldsForType(typeId);
      if (expandedTypeId !== typeId) setExpandedTypeId(typeId);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to save report field.",
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
                    No fields for this type yet. Click Configure to add fields.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field) => (
                      <div key={getId(field)} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-sm font-medium text-foreground">
                            {field.label}
                          </label>
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
                        <Input
                          readOnly
                          value={field.key}
                          placeholder="input field"
                          className="bg-muted/30"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </OperationsReportingTypeCard>
            );
          })}
        </div>
      )}

      <OperationsReportingFieldFormModal
        visible={fieldModalOpen}
        onClose={() => {
          setFieldModalOpen(false);
          setEditingField(null);
        }}
        initial={editingField}
        loading={createFieldStatus === "isLoading" || updateFieldStatus === "isLoading"}
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
