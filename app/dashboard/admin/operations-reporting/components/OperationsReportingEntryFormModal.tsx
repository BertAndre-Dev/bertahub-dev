"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList } from "lucide-react";
import type {
  OperationsReportingEntry,
  OperationsReportingField,
} from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";

type FieldLike = Pick<OperationsReportingField, "label" | "key"> & {
  id?: string;
  _id?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  typeName: string;
  typeDescription?: string;
  fields: FieldLike[];
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void;
  loading?: boolean;
  initial?: OperationsReportingEntry | null;
  submitLabel?: string;
};

function parseInputValue(raw: string): string | number | boolean {
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  const asNum = Number(trimmed);
  if (trimmed !== "" && Number.isFinite(asNum) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return asNum;
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

function isDateField(field: FieldLike): boolean {
  const key = field.key.toLowerCase();
  const label = field.label.toLowerCase();
  return key === "date" || label === "date" || label.includes("date");
}

function toDateInputValue(value: unknown): string {
  if (value == null || value === "") return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildInitialValues(
  fields: FieldLike[],
  initial?: OperationsReportingEntry | null,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const field of fields) {
    const key = field.key;
    const val = initial?.data?.[key];
    if (val == null) {
      next[key] = "";
    } else if (isDateField(field)) {
      next[key] = toDateInputValue(val);
    } else {
      next[key] = String(val);
    }
  }
  return next;
}

export default function OperationsReportingEntryFormModal({
  visible,
  onClose,
  typeName,
  typeDescription,
  fields,
  onSubmit,
  loading = false,
  initial,
  submitLabel,
}: Readonly<Props>) {
  const sortedFields = useMemo(
    () =>
      [...fields].sort((a, b) => {
        const aDate = isDateField(a);
        const bDate = isDateField(b);
        if (aDate && !bDate) return -1;
        if (!aDate && bDate) return 1;
        return a.label.localeCompare(b.label);
      }),
    [fields],
  );

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) {
      setValues({});
      return;
    }
    setValues(buildInitialValues(sortedFields, initial));
  }, [visible, initial, sortedFields]);

  const canSubmit = sortedFields.some((f) => (values[f.key] ?? "").trim().length > 0);

  const handleSubmit = async () => {
    const data: Record<string, unknown> = {};
    for (const field of sortedFields) {
      const raw = values[field.key] ?? "";
      const trimmed = raw.trim();
      if (!trimmed) continue;
      data[field.key] = parseInputValue(trimmed);
    }
    if (!Object.keys(data).length) return;
    await onSubmit(data);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      contentClassName="md:w-[min(560px,95vw)]"
    >
      <div className="flex max-h-[85vh] w-full min-w-0 flex-col">
        <div className="shrink-0 space-y-4 pr-2">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#0150AC1A", color: "#0150AC" }}
            >
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {initial ? "Edit report entry" : "Fill report"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter values for each field configured on this report type.
              </p>
            </div>
          </div>

          {typeName ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Report type
              </p>
              <p className="mt-1 font-semibold text-foreground">{typeName}</p>
              {typeDescription ? (
                <p className="mt-1 text-sm text-muted-foreground">{typeDescription}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
          {!sortedFields.length ? (
            <p className="text-sm text-muted-foreground">
              No fields configured for this type. Add fields under Configure Report first.
            </p>
          ) : (
            sortedFields.map((field) => {
              const key = field.key;
              const inputId = `ops-entry-${key.replace(/\s+/g, "-")}`;
              const useDateInput = isDateField(field);

              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={inputId} className="text-sm font-medium">
                    {field.label}
                  </Label>
                  <Input
                    id={inputId}
                    type={useDateInput ? "date" : "text"}
                    value={values[key] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder={`Enter ${field.label}`}
                  />
                  <p className="text-xs text-muted-foreground font-mono">{key}</p>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex shrink-0 justify-end gap-2 border-t border-border pt-4 pr-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="min-w-[100px] text-white"
            style={{ backgroundColor: "#0150AC" }}
            disabled={!canSubmit || loading || !sortedFields.length}
            onClick={handleSubmit}
          >
            {loading
              ? "Saving..."
              : (submitLabel ?? (initial ? "Update entry" : "Save"))}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
