"use client";

import React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ExpenseEntry } from "@/redux/slice/admin/expense-entry/expense-entry";

export interface ViewExpenseEntryModalProps {
  open: boolean;
  loading: boolean;
  item: ExpenseEntry | null;
  onOpenChange: (open: boolean) => void;
}

export function ViewExpenseEntryModal({
  open,
  loading,
  item,
  onOpenChange,
}: Readonly<ViewExpenseEntryModalProps>) {
  let body: React.ReactNode = null;
  if (loading) {
    body = <p className="text-sm text-muted-foreground py-6">Loading...</p>;
  } else if (item == null) {
    body = <p className="text-sm text-muted-foreground py-6">No data.</p>;
  } else {
    body = (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm">
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-sm">₦{Number(item.amount ?? 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="text-sm">{item.description || "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Reference No</p>
          <p className="text-sm">{item.documentNumber || "—"}</p>
        </div>
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Expense Entry Details</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

