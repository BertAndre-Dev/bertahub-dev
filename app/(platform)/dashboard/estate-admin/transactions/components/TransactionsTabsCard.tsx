import React from "react";
import { Card } from "@/components/ui/card";

export type TransactionsActiveTab = "history" | "vends" | "paid-bills";

type TabDef = { id: TransactionsActiveTab; label: string };

type Props = {
  activeTab: TransactionsActiveTab;
  onTabChange: (tab: TransactionsActiveTab) => void;
  tabs?: TabDef[];
  history: React.ReactNode;
  vends?: React.ReactNode;
  paidBills: React.ReactNode;
};

export function TransactionsTabsCard({
  activeTab,
  onTabChange,
  tabs = [
    // { id: "history" as const, label: "Transaction History" },
    { id: "vends" as const, label: "Estate Vends" },
    { id: "paid-bills" as const, label: "Paid Bills" },
  ],
  history,
  vends,
  paidBills,
}: Readonly<Props>) {
  return (
    <Card className="p-4">
      <div className="flex gap-2 border-b border-border overflow-x-auto mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium cursor-pointer border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "history" ? history : null}
      {activeTab === "vends" ? vends ?? null : null}
      {activeTab === "paid-bills" ? paidBills : null}
    </Card>
  );
}

