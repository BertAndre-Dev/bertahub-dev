"use client";

import { ArrowLeftRight, BadgeCheck, Banknote } from "lucide-react";
import { KpiCard } from "@/app/(platform)/dashboard/super-admin/dashboard/components/kpi-card";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import type { TransactionSummary } from "@/types/analytics";

type TransactionStatCardsProps = Readonly<{
  data: TransactionSummary;
}>;

export function TransactionStatCards({ data }: TransactionStatCardsProps) {
  const netFlow = Number(data.netFlow ?? 0);
  const sign = netFlow > 0 ? "+" : netFlow < 0 ? "-" : "";
  const netDisplay = `${sign}${formatTransactionAmount(Math.abs(netFlow))}`;
  const netPositive = netFlow > 0;
  const netNegative = netFlow < 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <KpiCard
        label="Total transactions"
        value={data.totalTransactions.toLocaleString()}
        icon={ArrowLeftRight}
        iconBgClassName="bg-[#D0DFF280] text-[#0150AC]"
      />
      <KpiCard
        label="Net flow"
        value={netDisplay}
        icon={Banknote}
        iconBgClassName={
          netNegative
            ? "bg-red-500/10 text-red-500"
            : "bg-emerald-500/10 text-emerald-600"
        }
        valueClassName={
          netPositive
            ? "text-emerald-600 dark:text-emerald-400"
            : netNegative
              ? "text-red-500 dark:text-red-400"
              : undefined
        }
      />
      {/* <KpiCard
        label="Paid transactions"
        value={data.paidTransactions.toLocaleString()}
        icon={BadgeCheck}
        iconBgClassName="bg-[#E6F4EA] text-[#007A4D]"
      /> */}
    </div>
  );
}

export default TransactionStatCards;
