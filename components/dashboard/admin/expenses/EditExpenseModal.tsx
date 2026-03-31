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

export interface EditExpenseModalProps {
  open: boolean;
  saving: boolean;
  headName: string;
  description: string;
  amount: string;
  documentNumber: string;
  onOpenChange: (open: boolean) => void;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDocumentNumberChange: (value: string) => void;
  onSubmit: () => void;
}

export function EditExpenseModal({
  open,
  saving,
  headName,
  description,
  amount,
  documentNumber,
  onOpenChange,
  onDescriptionChange,
  onAmountChange,
  onDocumentNumberChange,
  onSubmit,
}: Readonly<EditExpenseModalProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-expense-head">
              Expense Head
            </label>
            <Input id="edit-expense-head" value={headName} disabled />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-expense-desc">
              Description
            </label>
            <Input
              id="edit-expense-desc"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-expense-amount">
              Amount
            </label>
            <Input
              id="edit-expense-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-expense-ref">
              Reference Number
            </label>
            <Input
              id="edit-expense-ref"
              value={documentNumber}
              onChange={(e) => onDocumentNumberChange(e.target.value)}
            />
          </div>

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
              {saving ? "Saving..." : "Update"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

