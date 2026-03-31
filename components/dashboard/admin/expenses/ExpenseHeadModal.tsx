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

export interface ExpenseHeadModalValues {
  name: string;
  description: string;
}

export interface ExpenseHeadModalProps {
  open: boolean;
  saving: boolean;
  title: string;
  submitLabel: string;
  values: ExpenseHeadModalValues;
  onOpenChange: (open: boolean) => void;
  onChange: (values: ExpenseHeadModalValues) => void;
  onSubmit: () => void;
}

export function ExpenseHeadModal({
  open,
  saving,
  title,
  submitLabel,
  values,
  onOpenChange,
  onChange,
  onSubmit,
}: Readonly<ExpenseHeadModalProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="eh-name">
              Expense Head
            </label>
            <Input
              id="eh-name"
              value={values.name}
              onChange={(e) => onChange({ ...values, name: e.target.value })}
              placeholder="Maintenance"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="eh-desc">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="eh-desc"
              value={values.description}
              onChange={(e) =>
                onChange({ ...values, description: e.target.value })
              }
              placeholder="Description"
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
            <Button
              type="button"
              onClick={onSubmit}
              disabled={saving || !values.name.trim()}
            >
              {saving ? "Saving..." : submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

