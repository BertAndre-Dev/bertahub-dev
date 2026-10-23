import React from "react";
import { Card } from "@/components/ui/card";

type Props = {
  search: string;
  onSearchChange: (next: string) => void;
};

export function TransactionsSearchCard({
  search,
  onSearchChange,
}: Readonly<Props>) {
  return (
    <Card className="p-4">
      <div className="mt-3">
        <input
          type="text"
          placeholder="Search transactions by resident name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </Card>
  );
}

