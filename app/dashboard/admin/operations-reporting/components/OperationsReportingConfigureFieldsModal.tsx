"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OperationsReportingField } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";

const toFieldKey = (str: string) =>
  str
    .replace(/[^a-zA-Z0-9 /]/g, "")
    .trim();

type FieldRow = {
  id: string;
  label: string;
  key: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  typeName: string;
  typeDescription?: string;
  existingFields?: OperationsReportingField[];
  loading?: boolean;
  submitLabel?: string;
  onSubmit: (fields: { label: string; key: string }[]) => Promise<void> | void;
};

function newRow(): FieldRow {
  return { id: `row-${Date.now()}-${Math.random()}`, label: "", key: "" };
}

export default function OperationsReportingConfigureFieldsModal({
  visible,
  onClose,
  typeName,
  typeDescription,
  existingFields = [],
  loading = false,
  submitLabel = "Save",
  onSubmit,
}: Readonly<Props>) {
  const [rows, setRows] = useState<FieldRow[]>([newRow()]);

  useEffect(() => {
    if (visible) {
      setRows([newRow()]);
    }
  }, [visible]);

  const addRow = () => setRows((prev) => [...prev, newRow()]);

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const updateRow = (id: string, patch: Partial<Pick<FieldRow, "label" | "key">>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        if (patch.label !== undefined && !r.key) {
          next.key = toFieldKey(patch.label);
        }
        return next;
      }),
    );
  };

  const newFieldPayloads = rows
    .map((r) => ({ label: r.label.trim(), key: r.key.trim() }))
    .filter((r) => r.label.length >= 2 && r.key.length >= 1);

  const canSubmit = newFieldPayloads.length > 0;

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="flex max-h-[85vh] w-full min-w-0 flex-col pr-2">
        <div className="shrink-0 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add fields to report type
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure the input fields required for this report type.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Report type
            </p>
            <p className="mt-1 font-semibold text-foreground">{typeName}</p>
            {typeDescription ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{typeDescription}</p>
            ) : null}
          </div>
        </div>

        {existingFields.length > 0 ? (
          <div className="mt-4 shrink-0 space-y-2">
            <p className="text-sm font-medium text-foreground">Existing fields</p>
            <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3 text-sm">
              {existingFields.map((f) => (
                <li key={f.id ?? f._id ?? f.label} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{f.label}</span>
                  <span className="ml-2 font-mono text-xs">({f.key})</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Add fields</p>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1 h-4 w-4" />
              Add field
            </Button>
          </div>

          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="rounded-lg border border-border border-l-4 border-l-[#0150AC] bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Input field label
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                    aria-label={`Remove field ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <Input
                    value={row.label}
                    onChange={(e) => updateRow(row.id, { label: e.target.value })}
                    placeholder="e.g. Generator Color"
                  />
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Key</label>
                    <Input
                      value={row.key}
                      onChange={(e) => updateRow(row.id, { key: e.target.value })}
                      placeholder="e.g. generatorColor"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex shrink-0 justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="text-white"
            style={{ backgroundColor: "#0150AC" }}
            disabled={!canSubmit || loading}
            onClick={async () => onSubmit(newFieldPayloads)}
          >
            {loading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
