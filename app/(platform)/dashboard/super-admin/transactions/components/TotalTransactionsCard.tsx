"use client";

import React from "react";
import { Card } from "@/components/ui/card";

export function TotalTransactionsCard({
  grandTotal,
}: Readonly<{ grandTotal: number }>) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="p-6 bg-white">
        <div className="flex flex-col space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Total Transactions
          </p>
          <p className="text-3xl font-bold">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
            }).format(grandTotal)}
          </p>
        </div>
      </Card>
    </div>
  );
}

