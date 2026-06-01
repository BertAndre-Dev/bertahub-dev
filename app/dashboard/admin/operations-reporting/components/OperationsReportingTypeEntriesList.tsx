"use client";

import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildEntryDisplayRows,
  formatEntryValue,
  getEntrySortDate,
  humanizeFieldKey,
} from "@/components/dashboard/company/operations/lib/format-entry";

type Field = {
  id?: string;
  _id?: string;
  label: string;
  key: string;
};

type Entry = {
  id?: string;
  _id?: string;
  data?: Record<string, unknown>;
  createdAt?: string;
};

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

type Props = {
  fields: Field[];
  fieldsLoading?: boolean;
  entriesByField: Record<string, Entry[]>;
  entriesLoadingByField: Record<string, boolean>;
  onEditEntry?: (fieldId: string, entry: Entry) => void;
  onDeleteEntry?: (fieldId: string, entry: Entry) => void;
  deleteEntryLoading?: boolean;
};

export default function OperationsReportingTypeEntriesList({
  fields,
  fieldsLoading = false,
  entriesByField,
  entriesLoadingByField,
  onEditEntry,
  onDeleteEntry,
  deleteEntryLoading = false,
}: Readonly<Props>) {
  if (fieldsLoading) {
    return <p className="text-sm text-muted-foreground">Loading sections...</p>;
  }

  if (!fields.length) {
    return (
      <p className="text-sm text-muted-foreground">No sections configured for this type.</p>
    );
  }

  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const fieldId = getId(field);
        const entries = [...(entriesByField[fieldId] ?? [])].sort(
          (a, b) => getEntrySortDate(b) - getEntrySortDate(a),
        );
        const entriesLoading = entriesLoadingByField[fieldId];

        return (
          <div key={fieldId} className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{field.label}</p>

            {entriesLoading ? (
              <p className="text-sm text-muted-foreground">Loading entries...</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries for this section.</p>
            ) : (
              entries.map((entry) => {
                const entryId = getId(entry);
                const data = entry.data ?? {};
                const rows = buildEntryDisplayRows(data);
                const reportDate = data.date;

                return (
                  <div
                    key={entryId || JSON.stringify(data)}
                    className="rounded-lg border border-border bg-muted/10 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        {reportDate != null && reportDate !== "" ? (
                          <p className="text-xs text-muted-foreground">
                            {formatEntryValue("date", reportDate)}
                          </p>
                        ) : null}
                      </div>
                      {onEditEntry || onDeleteEntry ? (
                        <div className="flex shrink-0 items-center gap-1">
                          {onEditEntry ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#0150AC]"
                              onClick={() => onEditEntry(fieldId, entry)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {onDeleteEntry ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              disabled={deleteEntryLoading}
                              onClick={() => onDeleteEntry(fieldId, entry)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {rows.flatMap((row) =>
                        row.keys.map((key) => (
                          <div key={key} className="min-w-0 space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              {humanizeFieldKey(key)}
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {formatEntryValue(key, data[key])}
                            </p>
                          </div>
                        )),
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}
