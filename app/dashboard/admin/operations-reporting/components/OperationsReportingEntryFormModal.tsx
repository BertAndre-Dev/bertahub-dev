"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList } from "lucide-react";
import type { AppDispatch } from "@/redux/store";
import {
  getOperationsReportingFieldById,
  type OperationsReportingEntry,
  type OperationsReportingField,
} from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";

type Props = {
  visible: boolean;
  onClose: () => void;
  fieldId: string;
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

export default function OperationsReportingEntryFormModal({
  visible,
  onClose,
  fieldId,
  onSubmit,
  loading = false,
  initial,
  submitLabel,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [field, setField] = useState<OperationsReportingField | null>(null);
  const [fieldLoading, setFieldLoading] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible || !fieldId) {
      setField(null);
      setValues({});
      return;
    }

    (async () => {
      setFieldLoading(true);
      try {
        const res = await dispatch(getOperationsReportingFieldById(fieldId)).unwrap();
        const loaded = res?.data ?? null;
        setField(loaded);

        if (initial?.data && Object.keys(initial.data).length > 0) {
          const next: Record<string, string> = {};
          for (const [k, v] of Object.entries(initial.data)) {
            next[k] = v == null ? "" : String(v);
          }
          setValues(next);
        } else if (loaded?.key) {
          const existing = initial?.data?.[loaded.key];
          setValues({
            [loaded.key]: existing == null ? "" : String(existing),
          });
        } else {
          setValues({ value: "" });
        }
      } catch {
        toast.error("Failed to load report field.");
        setField(null);
        setValues({});
      } finally {
        setFieldLoading(false);
      }
    })();
  }, [visible, fieldId, initial, dispatch]);

  const dataKeys = Object.keys(values);
  const canSubmit = dataKeys.some((k) => values[k].trim().length > 0);

  const handleSubmit = async () => {
    const data: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(values)) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      data[key] = parseInputValue(trimmed);
    }
    if (!Object.keys(data).length) return;
    await onSubmit(data);
  };

  const primaryKey = field?.key ?? "value";
  const displayKeys =
    initial?.data && Object.keys(initial.data).length > 0
      ? Object.keys(values)
      : field?.key
        ? [field.key]
        : ["value"];

  return (
    <Modal visible={visible} onClose={onClose}>
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
                Enter values for this report section. Data is saved as open-ended
                key-value pairs.
              </p>
            </div>
          </div>

          {field ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Report section
              </p>
              <p className="mt-1 font-semibold text-foreground">{field.label}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {field.key}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
          {fieldLoading ? (
            <p className="text-sm text-muted-foreground">Loading field...</p>
          ) : !field && fieldId ? (
            <p className="text-sm text-muted-foreground">Could not load field.</p>
          ) : (
            displayKeys.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`ops-entry-${key}`} className="text-sm font-medium">
                  {key === primaryKey && field?.label
                    ? field.label
                    : key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Label>
                <Input
                  id={`ops-entry-${key}`}
                  value={values[key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={`Enter ${field?.label ?? key}`}
                />
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex shrink-0 justify-end gap-2 border-t border-border pt-4 pr-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="min-w-[100px] text-white"
            style={{ backgroundColor: "#0150AC" }}
            disabled={!canSubmit || loading || fieldLoading}
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
