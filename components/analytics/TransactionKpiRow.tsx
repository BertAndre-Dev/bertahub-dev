"use client";

import { ArrowLeftRight, Banknote, Receipt, Wallet } from "lucide-react";
import { KpiCard } from "@/app/(platform)/dashboard/super-admin/dashboard/components/kpi-card";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import type { TransactionAnalyticsDashboard } from "@/types/analytics";

type TransactionKpiRowProps = Readonly<{
  data: TransactionAnalyticsDashboard;
}>;

export function TransactionKpiRow({ data }: TransactionKpiRowProps) {
  const netFlow = Number(data.summary?.netFlow ?? 0);
  const netAbs = formatTransactionAmount(Math.abs(netFlow));
  let netDisplay = netAbs;
  if (netFlow > 0) netDisplay = `+${netAbs}`;
  if (netFlow < 0) netDisplay = `-${netAbs}`;

  let netValueClass: string | undefined;
  if (netFlow > 0) netValueClass = "text-emerald-600 dark:text-emerald-400";
  if (netFlow < 0) netValueClass = "text-red-500 dark:text-red-400";

  const netNegative = netFlow < 0;
  const netIconBg = netNegative
    ? "bg-red-500/10 text-red-500"
    : "bg-emerald-500/10 text-emerald-600";
  const totalCharges = Number(
    data.chargeAnalytics?.summary?.totalCharges ?? 0,
  );
  const averageAmount = Number(data.metrics?.averageAmount ?? 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total transactions"
        value={(data.summary?.totalTransactions ?? 0).toLocaleString()}
        icon={ArrowLeftRight}
        iconBgClassName="bg-[#D0DFF280] text-[#0150AC]"
      />
      <KpiCard
        label="Net flow"
        value={netDisplay}
        icon={Banknote}
        iconBgClassName={netIconBg}
        valueClassName={netValueClass}
      />
      <KpiCard
        label="Average amount"
        value={formatTransactionAmount(averageAmount)}
        icon={Wallet}
        iconBgClassName="bg-violet-500/10 text-violet-600"
      />
      <KpiCard
        label="Total charges"
        value={formatTransactionAmount(totalCharges)}
        icon={Receipt}
        iconBgClassName="bg-amber-500/10 text-amber-700"
      />
    </div>
  );
}

export default TransactionKpiRow;
