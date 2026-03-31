"use client";

import React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface ExpensesHeaderProps {
  title: string;
  estateName: string;
  onAddExpense: () => void;
  actionLabel?: string;
}

export function ExpensesHeader({
  title,
  estateName,
  onAddExpense,
  actionLabel = "Add Expense",
}: Readonly<ExpensesHeaderProps>) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s an overview on{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {estateName}
          </span>.
        </p>
      </div>

      <Button className="gap-2 self-start" onClick={onAddExpense}>
        <Plus className="h-4 w-4" />
        {actionLabel}
      </Button>
    </div>
  );
}

