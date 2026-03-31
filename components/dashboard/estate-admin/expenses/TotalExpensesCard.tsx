"use client";

import React from "react";

import { Card } from "@/components/ui/card";

export interface TotalExpensesCardProps {
  total: number;
}

export function TotalExpensesCard({ total }: Readonly<TotalExpensesCardProps>) {
  return (
    <Card className="mt-0 p-6">
      <p className="text-sm text-muted-foreground">Total Expenses</p>
      <p className="text-4xl font-bold mt-2">₦{total.toLocaleString()}</p>
    </Card>
  );
}

