"use client";

import { Card } from "@/components/ui/card";
import BillsBreakdownPie from "./bills-breakdown-pie";

interface BillsBreakdownCardData {
  name: string;
  value: number;
  amount?: string;
}

interface BillsBreakdownCardProps {
  title?: string;
  total?: number;
  data?: BillsBreakdownCardData[];
}

export default function BillsBreakdownCard({
  title = "Bills",
  total = 150000000,
  data,
}: BillsBreakdownCardProps) {
  const formattedTotal = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(total);

  return (
    <Card className="w-full bg-white border">
      <div className="px-6 pt-2 pb-4 border-b">
        <h2 className="font-heading text-2xl font-bold">{title}</h2>
        <div className=" flex items-baseline gap-2">
          <span className="text-muted-foreground text-sm">Total Transactions</span>
          <span className="text-[18px] font-bold">{formattedTotal}</span>
        </div>
      </div>
      <div className="p-6">
        <BillsBreakdownPie data={data} total={total} />
      </div>
    </Card>
  );
}
