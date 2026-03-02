"use client";

import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export interface MeterCreditSummaryData {
  averageCredit: number;
  totalCredit: number;
  maxCredit: number;
  minCredit: number;
  meterCount?: number;
}

interface MeterCreditSummaryProps {
  readonly data?: MeterCreditSummaryData | null;
  readonly loading?: boolean;
  readonly title?: string;
  readonly formatValue?: (n: number) => string;
}

const defaultFormat = (n: number) => Number(n).toLocaleString();

export default function MeterCreditSummary({
  data,
  loading = false,
  title = "Credit metrics",
  formatValue = defaultFormat,
}: MeterCreditSummaryProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="font-heading text-lg font-bold mb-4">{title}</h2>
        <div className="grid grid-cols-2 gap-3">
          {["Average", "Total", "Max", "Min"].map((l) => (
            <div key={l}>
              <p className="text-sm text-muted-foreground">{l}</p>
              <div className="mt-1 h-6 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const d = data ?? {
    averageCredit: 0,
    totalCredit: 0,
    maxCredit: 0,
    minCredit: 0,
  };

  const rows = [
    { label: "Average credit", value: d.averageCredit },
    { label: "Total credit", value: d.totalCredit },
    { label: "Max credit", value: d.maxCredit },
    { label: "Min credit", value: d.minCredit },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-lg bg-[#E6F4EA] p-2">
          <Wallet className="h-5 w-5 text-[#007A4D]" />
        </div>
        <h2 className="font-heading text-lg font-bold">{title}</h2>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-semibold tabular-nums">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
      {d.meterCount != null && (
        <p className="text-xs text-muted-foreground mt-3">
          {d.meterCount} meter{d.meterCount !== 1 ? "s" : ""} with credit data
        </p>
      )}
    </Card>
  );
}
