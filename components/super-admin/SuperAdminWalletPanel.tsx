"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import Table from "@/components/tables/list/page";
import { formatDateTime } from "@/lib/format-date";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import { computeWalletTotalBalance } from "@/lib/wallet-balance";

export type SuperAdminWalletSummary = {
  balance?: number;
  availableBalance?: number;
  withdrawableBalance?: number;
  temporaryBalance?: number;
  lockedBalance?: number;
  accountNumber?: string;
  bankCode?: string;
  autoSettlementEnabled?: boolean;
};

export type SuperAdminWalletCreditRow = {
  id: string;
  amount?: number;
  description?: string;
  source?: string;
  tx_ref?: string;
  createdAt?: string;
};

type SuperAdminWalletPanelProps = Readonly<{
  wallet: SuperAdminWalletSummary | null;
  credits: SuperAdminWalletCreditRow[];
  creditsLoading?: boolean;
  creditsPagination?: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  } | null;
  onCreditsPageChange?: (page: number) => void;
  onCreditsPageSizeChange?: (pageSize: number) => void;
  creditsPageSize?: number;
  walletLoading?: boolean;
  walletError?: string | null;
}>;

function formatNaira(value?: number) {
  return formatTransactionAmount(Number(value ?? 0));
}

export function SuperAdminWalletPanel({
  wallet,
  credits,
  creditsLoading = false,
  creditsPagination,
  onCreditsPageChange,
  onCreditsPageSizeChange,
  creditsPageSize,
  walletLoading = false,
  walletError = null,
}: SuperAdminWalletPanelProps) {
  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Date",
        render: (item: SuperAdminWalletCreditRow) =>
          formatDateTime(item.createdAt),
      },
      {
        key: "description",
        header: "Description",
        render: (item: SuperAdminWalletCreditRow) => (
          <span
            className="block max-w-72 truncate normal-case"
            title={item.description}
          >
            {item.description || "—"}
          </span>
        ),
      },
      {
        key: "source",
        header: "Source",
        render: (item: SuperAdminWalletCreditRow) => item.source || "—",
      },
      {
        key: "amount",
        header: "Amount",
        align: "right" as const,
        render: (item: SuperAdminWalletCreditRow) =>
          formatNaira(item.amount),
      },
    ],
    [],
  );

  if (walletLoading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Loading wallet...
      </p>
    );
  }

  if (walletError && !wallet) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
        {walletError}
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No wallet has been set up for this account yet.
      </div>
    );
  }

  const settlementLabel = [wallet.accountNumber, wallet.bankCode]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      {settlementLabel ? (
        <p className="text-sm text-muted-foreground">
          Settlement account:{" "}
          <span className="font-medium tabular-nums text-foreground">
            {settlementLabel}
          </span>
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* <BalanceCard
          label="Total balance"
          value={computeWalletTotalBalance(wallet)}
        /> */}
        <BalanceCard label="Available balance" value={wallet.availableBalance} />
        <BalanceCard
          label="Withdrawable balance"
          value={wallet.withdrawableBalance}
        />
        <BalanceCard
          label="Temporary balance"
          value={wallet.temporaryBalance}
        />
        {/* <BalanceCard label="Locked balance" value={wallet.lockedBalance} /> */}
      </div>

      {wallet.autoSettlementEnabled != null ? (
        <p className="text-sm text-muted-foreground">
          Auto settlement:{" "}
          <span className="font-medium text-foreground">
            {wallet.autoSettlementEnabled ? "Enabled" : "Disabled"}
          </span>
        </p>
      ) : null}

      <Card className="gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-heading text-base font-bold text-foreground">
            Recent credits
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Latest wallet credit entries
          </p>
        </div>
        <div className="p-4">
          {creditsLoading && credits.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading credits...
            </p>
          ) : (
            <Table
              columns={columns}
              data={credits}
              emptyMessage="No wallet credits yet."
              showPagination={Boolean(
                creditsPagination && creditsPagination.total > 0,
              )}
              paginationInfo={
                creditsPagination
                  ? {
                      total: creditsPagination.total,
                      current: creditsPagination.page,
                      pageSize:
                        creditsPageSize ?? creditsPagination.limit,
                    }
                  : undefined
              }
              onPageChange={onCreditsPageChange}
              onPageSizeChange={onCreditsPageSizeChange}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function BalanceCard({
  label,
  value,
}: Readonly<{ label: string; value?: number }>) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
        {formatNaira(value)}
      </p>
    </div>
  );
}

export default SuperAdminWalletPanel;
