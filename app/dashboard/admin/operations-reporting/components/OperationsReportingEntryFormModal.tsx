"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, ClipboardList, Plus, Trash2 } from "lucide-react";
import type { OperationsReportingEntry } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";

type CustomRow = { id: string; key: string; value: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  fieldLabel: string;
  fieldKey?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void;
  loading?: boolean;
  initial?: OperationsReportingEntry | null;
  submitLabel?: string;
};

const STANDARD_METRICS = [
  {
    key: "condition",
    label: "Condition",
    placeholder: "e.g. good, fair, poor",
    type: "text" as const,
  },
  {
    key: "amount",
    label: "Amount",
    placeholder: "0",
    type: "number" as const,
  },
  {
    key: "usage",
    label: "Usage",
    placeholder: "0",
    type: "number" as const,
  },
] as const;

const METRIC_KEYS = new Set(STANDARD_METRICS.map((m) => m.key));

function toDateInputValue(value: unknown): string {
  if (value == null || value === "") return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseMetricValue(raw: string, type: "text" | "number") {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  if (type === "number") {
    const asNum = Number(trimmed);
    return Number.isFinite(asNum) ? asNum : trimmed;
  }
  return trimmed;
}

function buildFormState(data?: Record<string, unknown>) {
  const metrics: Record<string, string> = {};
  for (const m of STANDARD_METRICS) {
    const val = data?.[m.key];
    metrics[m.key] = val == null ? "" : String(val);
  }

  const custom: CustomRow[] = [];
  if (data) {
    Object.entries(data).forEach(([key, value], index) => {
      if (key === "date" || METRIC_KEYS.has(key as (typeof STANDARD_METRICS)[number]["key"])) {
        return;
      }
      custom.push({
        id: `custom-${index}`,
        key,
        value: value == null ? "" : String(value),
      });
    });
  }

  return {
    reportDate: toDateInputValue(data?.date),
    metrics,
    custom: custom.length ? custom : [{ id: "custom-0", key: "", value: "" }],
  };
}

function buildPayload(
  reportDate: string,
  metrics: Record<string, string>,
  custom: CustomRow[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (reportDate.trim()) {
    result.date = reportDate.trim();
  }

  for (const m of STANDARD_METRICS) {
    const parsed = parseMetricValue(metrics[m.key] ?? "", m.type);
    if (parsed !== undefined) result[m.key] = parsed;
  }

  for (const row of custom) {
    const k = row.key.trim();
    if (!k || METRIC_KEYS.has(k as (typeof STANDARD_METRICS)[number]["key"]) || k === "date") {
      continue;
    }
    const parsed = parseMetricValue(row.value, "text");
    if (parsed !== undefined) result[k] = parsed;
  }

  return result;
}

export default function OperationsReportingEntryFormModal({
  visible,
  onClose,
  fieldLabel,
  fieldKey,
  onSubmit,
  loading = false,
  initial,
  submitLabel,
}: Readonly<Props>) {
  const [reportDate, setReportDate] = useState("");
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [customRows, setCustomRows] = useState<CustomRow[]>([
    { id: "custom-0", key: "", value: "" },
  ]);

  useEffect(() => {
    const next = buildFormState(initial?.data);
    setReportDate(next.reportDate);
    setMetrics(next.metrics);
    setCustomRows(next.custom);
  }, [initial, visible]);

  const canSubmit = useMemo(() => {
    const hasDate = reportDate.trim().length > 0;
    const hasMetric = STANDARD_METRICS.some((m) => metrics[m.key]?.trim());
    const hasCustom = customRows.some((r) => r.key.trim() && r.value.trim());
    return hasDate || hasMetric || hasCustom;
  }, [reportDate, metrics, customRows]);

  const updateMetric = (key: string, value: string) => {
    setMetrics((prev) => ({ ...prev, [key]: value }));
  };

  const addCustomRow = () => {
    setCustomRows((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, key: "", value: "" },
    ]);
  };

  const removeCustomRow = (id: string) => {
    setCustomRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((r) => r.id !== id),
    );
  };

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
                {initial ? "Edit report entry" : "Add report entry"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Record operational data for this report field.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Report field
            </p>
            <p className="mt-1 font-semibold text-foreground">{fieldLabel}</p>
            {fieldKey ? (
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{fieldKey}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 min-h-0 flex-1 space-y-5 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label
              htmlFor="ops-entry-date"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Report date
            </Label>
            <Input
              id="ops-entry-date"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="cursor-pointer max-w-xs"
            />
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Metrics</h3>
              <p className="text-xs text-muted-foreground">
                Standard values for this report (all optional except where noted).
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Metric</span>
                <span>Value</span>
              </div>
              {STANDARD_METRICS.map((metric) => (
                <div
                  key={metric.key}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <Label
                    htmlFor={`metric-${metric.key}`}
                    className="flex items-center text-sm font-medium text-foreground"
                  >
                    {metric.label}
                  </Label>
                  <Input
                    id={`metric-${metric.key}`}
                    type={metric.type}
                    value={metrics[metric.key] ?? ""}
                    onChange={(e) => updateMetric(metric.key, e.target.value)}
                    placeholder={metric.placeholder}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Additional fields
                </h3>
                <p className="text-xs text-muted-foreground">
                  Add extra key-value pairs if needed.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={addCustomRow}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add field
              </Button>
            </div>
            <div className="space-y-2">
              {customRows.map((row, index) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-dashed border-border bg-background p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Field name {index + 1}
                    </Label>
                    <Input
                      value={row.key}
                      onChange={(e) =>
                        setCustomRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, key: e.target.value } : r,
                          ),
                        )
                      }
                      placeholder="e.g. notes"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Value</Label>
                    <Input
                      value={row.value}
                      onChange={(e) =>
                        setCustomRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, value: e.target.value } : r,
                          ),
                        )
                      }
                      placeholder="Enter value"
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-end justify-end sm:pb-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      onClick={() => removeCustomRow(row.id)}
                      disabled={customRows.length <= 1}
                      aria-label="Remove field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex shrink-0 justify-end gap-2 border-t border-border pt-4 pr-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="min-w-[100px] text-white"
            style={{ backgroundColor: "#0150AC" }}
            disabled={!canSubmit || loading}
            onClick={async () => onSubmit(buildPayload(reportDate, metrics, customRows))}
          >
            {loading
              ? "Saving..."
              : (submitLabel ?? (initial ? "Update entry" : "Save entry"))}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
