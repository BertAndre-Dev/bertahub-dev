"use client";

import { Banknote, Receipt } from "lucide-react";
import { KpiCard } from "@/app/(platform)/dashboard/super-admin/dashboard/components/kpi-card";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import type { PlatformFeeCards } from "@/types/analytics";

type PlatformFeeKpiRowProps = Readonly<{
  cards: PlatformFeeCards;
}>;

export function PlatformFeeKpiRow({ cards }: PlatformFeeKpiRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <KpiCard
        label="Total settled fees"
        value={formatTransactionAmount(Number(cards.total ?? 0))}
        icon={Banknote}
        iconBgClassName="bg-emerald-500/10 text-emerald-600"
      />
      <KpiCard
        label="Fee transactions"
        value={Number(cards.count ?? 0).toLocaleString()}
        icon={Receipt}
        iconBgClassName="bg-blue-500/10 text-blue-600"
      />
    </div>
  );
}

export default PlatformFeeKpiRow;
