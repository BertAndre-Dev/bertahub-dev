"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExpenseEntry } from "@/redux/slice/estate-admin/expense-entry/expense-entry";

export interface ViewExpenseModalProps {
  open: boolean;
  loading: boolean;
  item: ExpenseEntry | null;
  onOpenChange: (open: boolean) => void;
}

export function ViewExpenseModal({
  open,
  loading,
  item,
  onOpenChange,
}: Readonly<ViewExpenseModalProps>) {
  let body: React.ReactNode = (
    <div className="py-10 text-center text-muted-foreground">No details found.</div>
  );

  if (loading) {
    body = (
      <div className="py-10 text-center text-muted-foreground">Loading...</div>
    );
  } else if (item) {
    body = (
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="text-sm">{item.description}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Reference No</p>
          <p className="text-sm">{item.documentNumber}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="text-sm font-semibold">
            ₦{(item.amount ?? 0).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Date</p>
          <p className="text-sm">
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
          </p>
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
          <DialogTitle>Expense Details</DialogTitle>
        </DialogHeader>

        {body}
      </DialogContent>
    </Dialog>
  );
}

