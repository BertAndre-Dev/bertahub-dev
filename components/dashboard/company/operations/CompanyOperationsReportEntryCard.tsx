"use client";

import React from "react";

import { Card } from "@/components/ui/card";
import type { CompanyOperationsReportingEntry } from "@/redux/slice/company/operations-reporting/company-operations-reporting";
import {
  buildEntryDisplayRows,
  formatEntryValue,
  humanizeFieldKey,
} from "./lib/format-entry";

type Props = {
  entry: CompanyOperationsReportingEntry;
  fieldLabel: string;
  subtitle?: string;
};

function FieldCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-foreground break-words">{value}</p>
    </div>
  );
}

export function CompanyOperationsReportEntryCard({
  entry,
  fieldLabel,
  subtitle,
}: Readonly<Props>) {
  const data = entry.data ?? {};
  const rows = buildEntryDisplayRows(data);

  return (
    <Card className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-6 space-y-1">
        <h2 className="font-heading text-xl font-bold text-foreground">{fieldLabel}</h2>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <div className="space-y-6">
        {rows.map((row) => {
          if (row.fullWidth) {
            const key = row.keys[0];
            return (
              <FieldCell
                key={key}
                label={humanizeFieldKey(key)}
                value={formatEntryValue(key, data[key])}
              />
            );
          }

          if (row.keys.length === 1) {
            const key = row.keys[0];
            return (
              <div key={key} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FieldCell
                  label={humanizeFieldKey(key)}
                  value={formatEntryValue(key, data[key])}
                />
              </div>
            );
          }

          return (
            <div
              key={row.keys.join("-")}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2"
            >
              {row.keys.map((key) => (
                <FieldCell
                  key={key}
                  label={humanizeFieldKey(key)}
                  value={formatEntryValue(key, data[key])}
                />
              ))}
            </div>
          );
        })}

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No report data recorded.</p>
        ) : null}
      </div>
    </Card>
  );
}
