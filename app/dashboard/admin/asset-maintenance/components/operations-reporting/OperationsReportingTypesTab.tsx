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
  createOperationsReportingField,
  createOperationsReportingType,
  deleteOperationsReportingField,
  deleteOperationsReportingType,
  getOperationsReportingFields,
  getOperationsReportingTypes,
  updateOperationsReportingField,
  updateOperationsReportingType,
  type OperationsReportingField,
  type OperationsReportingType,
} from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";
import { selectAdminOperationsReporting } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting-slice";
import OperationsReportingTypeFormModal from "./OperationsReportingTypeFormModal";
import OperationsReportingFieldFormModal from "./OperationsReportingFieldFormModal";

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

type Props = {
  estateId: string;
};

export default function OperationsReportingTypesTab({ estateId }: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<OperationsReportingType | null>(null);
  const [editingField, setEditingField] = useState<OperationsReportingField | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<OperationsReportingType | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<OperationsReportingField | null>(null);

  const {
    types,
    fields,
    getTypesStatus,
    getFieldsStatus,
    createTypeStatus,
    updateTypeStatus,
    deleteTypeStatus,
    createFieldStatus,
    updateFieldStatus,
    deleteFieldStatus,
  } = useSelector(selectAdminOperationsReporting);

  const selectedType = types.find((t) => getId(t) === selectedTypeId) ?? null;

  useEffect(() => {
    if (!estateId) return;
    dispatch(getOperationsReportingTypes(estateId))
      .unwrap()
      .then((res) => {
        const list = res?.data ?? [];
        setSelectedTypeId((prev) => {
          if (prev && list.some((t) => getId(t) === prev)) return prev;
          return getId(list[0]) ?? "";
        });
      })
      .catch(() => toast.error("Failed to load reporting types."));
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!selectedTypeId) {
      return;
    }
    dispatch(getOperationsReportingFields(selectedTypeId))
      .unwrap()
      .catch(() => toast.error("Failed to load report fields."));
  }, [dispatch, selectedTypeId]);

  const typeColumns = useMemo(
    () => [
      {
        key: "createdAt" as const,
        header: "Date",
        render: (item: OperationsReportingType) =>
          item.createdAt ? new Date(item.createdAt).toLocaleString() : "—",
        exportValue: (item: OperationsReportingType) =>
          item.createdAt ? new Date(item.createdAt).toISOString() : "",
      },
      { key: "name" as const, header: "Type" },
      {
        key: "description" as const,
        header: "Description",
        render: (item: OperationsReportingType) => item.description || "—",
      },
      {
        key: "actions" as const,
        header: "Actions",
        exportable: false,
        render: (item: OperationsReportingType) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={(e) => {
                e.stopPropagation();
                setEditingType(item);
                setTypeModalOpen(true);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive"
              disabled={deleteTypeStatus === "isLoading"}
              onClick={(e) => {
                e.stopPropagation();
                setTypeToDelete(item);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteTypeStatus],
  );

  const fieldColumns = useMemo(
    () => [
      {
        key: "createdAt" as const,
        header: "Date",
        render: (item: OperationsReportingField) =>
          item.createdAt ? new Date(item.createdAt).toLocaleString() : "—",
        exportValue: (item: OperationsReportingField) =>
          item.createdAt ? new Date(item.createdAt).toISOString() : "",
      },
      { key: "label" as const, header: "Label" },
      { key: "key" as const, header: "Key" },
      {
        key: "actions" as const,
        header: "Actions",
        exportable: false,
        render: (item: OperationsReportingField) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={(e) => {
                e.stopPropagation();
                setEditingField(item);
                setFieldModalOpen(true);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive"
              disabled={deleteFieldStatus === "isLoading"}
              onClick={(e) => {
                e.stopPropagation();
                setFieldToDelete(item);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteFieldStatus],
  );

  const handleTypeSubmit = async (payload: { name: string; description: string }) => {
    try {
      if (editingType) {
        const id = getId(editingType);
        if (!id) return;
        await dispatch(
          updateOperationsReportingType({
            typeId: id,
            name: payload.name,
            description: payload.description,
          }),
        ).unwrap();
        toast.success("Reporting type updated.");
      } else {
        const created = await dispatch(
          createOperationsReportingType({
            estateId,
            name: payload.name,
            description: payload.description,
          }),
        ).unwrap();
        const newTypeId = getId(created?.data);
        if (newTypeId) setSelectedTypeId(newTypeId);
        toast.success("Reporting type created.");
      }
      setTypeModalOpen(false);
      setEditingType(null);
      const typesRes = await dispatch(getOperationsReportingTypes(estateId)).unwrap();
      const list = typesRes?.data ?? [];
      setSelectedTypeId((prev) => {
        if (prev && list.some((t) => getId(t) === prev)) return prev;
        return getId(list[0]) ?? "";
      });
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to save reporting type.",
      );
    }
  };

  const handleFieldSubmit = async (payload: { label: string; key: string }) => {
    if (!estateId) {
      toast.error("Estate is not loaded yet. Please wait and try again.");
      return;
    }
    if (!selectedTypeId) {
      toast.info("Select a reporting type first.");
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
            typeId: selectedTypeId,
            label: payload.label,
            key: payload.key,
          }),
        ).unwrap();
        toast.success("Report field created.");
      }
      setFieldModalOpen(false);
      setEditingField(null);
      await dispatch(getOperationsReportingFields(selectedTypeId)).unwrap();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to save report field.",
      );
    }
  };

  return (
    <div className="space-y-8 mt-4">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-bold">Reporting types</h2>
            <p className="text-muted-foreground text-sm">
              Create types to organize operations reports (e.g. Fuel, Water).
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingType(null);
              setTypeModalOpen(true);
            }}
            className="shrink-0 text-white"
            style={{ backgroundColor: "#0150AC" }}
          >
            + Create type
          </Button>
        </div>

        <Table
          columns={typeColumns}
          data={types}
          emptyMessage={
            getTypesStatus === "isLoading"
              ? "Loading reporting types..."
              : "No reporting types yet. Create one to get started."
          }
          enableExport
          exportFileName="operations-reporting-types"
          onExportRequest={() => Promise.resolve(types)}
          onRowClick={(item) => {
            const id = getId(item);
            if (id) setSelectedTypeId(id);
          }}
        />
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-bold">Report fields</h2>
            <p className="text-muted-foreground text-sm">
              {selectedType
                ? `Fields for "${selectedType.name}".`
                : "Create a reporting type above, then add fields."}
            </p>
          </div>
          <Button
            onClick={() => {
              if (!selectedTypeId) {
                toast.info("Select a reporting type first.");
                return;
              }
              setEditingField(null);
              setFieldModalOpen(true);
            }}
            disabled={!selectedTypeId}
            className="shrink-0 text-white"
            style={{ backgroundColor: "#0150AC" }}
          >
            + Create field
          </Button>
        </div>

        <div className="space-y-1 max-w-xs">
          <label htmlFor="ops-config-type" className="text-sm font-medium">
            Reporting type
          </label>
          <select
            id="ops-config-type"
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

        <Table
          columns={fieldColumns}
          data={selectedTypeId ? fields : []}
          emptyMessage={
            !selectedTypeId
              ? "Select a reporting type to view fields."
              : getFieldsStatus === "isLoading"
                ? "Loading report fields..."
                : "No fields for this type yet."
          }
          enableExport
          exportFileName="operations-reporting-fields"
          onExportRequest={() => Promise.resolve(fields)}
        />
      </div>

      <OperationsReportingTypeFormModal
        visible={typeModalOpen}
        onClose={() => {
          setTypeModalOpen(false);
          setEditingType(null);
        }}
        initial={editingType}
        loading={createTypeStatus === "isLoading" || updateTypeStatus === "isLoading"}
        onSubmit={handleTypeSubmit}
      />

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
        visible={!!typeToDelete}
        onClose={() => setTypeToDelete(null)}
        itemName={typeToDelete?.name ?? "this type"}
        title="Delete reporting type"
        loading={deleteTypeStatus === "isLoading"}
        onConfirm={async () => {
          const id = getId(typeToDelete ?? undefined);
          if (!id) return;
          await dispatch(deleteOperationsReportingType(id)).unwrap();
          toast.success("Reporting type deleted.");
          setTypeToDelete(null);
          await dispatch(getOperationsReportingTypes(estateId)).unwrap();
        }}
      />

      <DeleteModal
        visible={!!fieldToDelete}
        onClose={() => setFieldToDelete(null)}
        itemName={fieldToDelete?.label ?? "this field"}
        title="Delete report field"
        loading={deleteFieldStatus === "isLoading"}
        onConfirm={async () => {
          const id = getId(fieldToDelete ?? undefined);
          if (!id || !selectedTypeId) return;
          await dispatch(deleteOperationsReportingField(id)).unwrap();
          toast.success("Report field deleted.");
          setFieldToDelete(null);
          await dispatch(getOperationsReportingFields(selectedTypeId)).unwrap();
        }}
      />
    </div>
  );
}
