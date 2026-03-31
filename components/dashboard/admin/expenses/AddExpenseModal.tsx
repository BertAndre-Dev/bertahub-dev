"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface AddExpenseDraftEntry {
  id: string;
  description: string;
  amount: string;
  documentNumber: string;
}

export interface AddExpenseModalProps {
  open: boolean;
  saving: boolean;
  headName: string;
  drafts: AddExpenseDraftEntry[];
  onOpenChange: (open: boolean) => void;
  onDraftChange: (
    id: string,
    field: "description" | "amount" | "documentNumber",
    value: string,
  ) => void;
  onAddDraft: () => void;
  onRemoveDraft: (id: string) => void;
  onSubmit: () => void;
  showDateAndUpload?: boolean;
  date?: string;
  file?: File | null;
  onDateChange?: (value: string) => void;
  onFileChange?: (file: File | null) => void;
}

export function AddExpenseModal({
  open,
  saving,
  headName,
  drafts,
  onOpenChange,
  onDraftChange,
  onAddDraft,
  onRemoveDraft,
  onSubmit,
  showDateAndUpload = true,
  date = "",
  file = null,
  onDateChange,
  onFileChange,
}: Readonly<AddExpenseModalProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="add-expense-head">
              Expense Head
            </label>
            <Input id="add-expense-head" value={headName} disabled />
          </div>

          {showDateAndUpload ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="add-expense-date">
                Date
              </label>
              <input
                id="add-expense-date"
                type="date"
                value={date}
                onChange={(e) => onDateChange?.(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Expenses</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddDraft}
              >
                + Add another
              </Button>
            </div>

            {drafts.map((row, idx) => (
              <div
                key={row.id}
                className="rounded-md border border-border/60 p-3 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor={`add-expense-desc-${idx}`}
                    >
                      Description
                    </label>
                    <Input
                      id={`add-expense-desc-${idx}`}
                      value={row.description}
                      onChange={(e) =>
                        onDraftChange(row.id, "description", e.target.value)
                      }
                      placeholder="fixing of disel gen"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor={`add-expense-amount-${idx}`}
                    >
                      Amount
                    </label>
                    <Input
                      id={`add-expense-amount-${idx}`}
                      inputMode="numeric"
                      value={row.amount}
                      onChange={(e) =>
                        onDraftChange(row.id, "amount", e.target.value)
                      }
                      placeholder="20000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor={`add-expense-ref-${idx}`}
                    >
                      Reference Number
                    </label>
                    <Input
                      id={`add-expense-ref-${idx}`}
                      value={row.documentNumber}
                      onChange={(e) =>
                        onDraftChange(row.id, "documentNumber", e.target.value)
                      }
                      placeholder="INV/001"
                    />
                  </div>
                </div>

                {drafts.length > 1 && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveDraft(row.id)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showDateAndUpload ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="add-expense-file">
                Upload supporting document (Receipt/ Invoice)
              </label>
              <input
                id="add-expense-file"
                type="file"
                onChange={(e) => onFileChange?.(e.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
              {file ? (
                <p className="text-xs text-muted-foreground">{file.name}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit} disabled={saving}>
              {saving ? "Saving..." : "Add Expense"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

