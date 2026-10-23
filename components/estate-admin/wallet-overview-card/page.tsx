"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import type { RevenueWithdrawalRole } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import { RevenueWithdrawalOverviewProvider } from "@/components/wallet/RevenueWithdrawalAccountsCard";
import { computeWalletTotalBalance } from "@/lib/wallet-balance";

export interface WalletOverviewWallet {
  balance?: number;
  availableBalance?: number;
  temporaryBalance?: number;
  withdrawableBalance?: number;
  lockedBalance?: number;
  accountNumber?: string;
}

export interface WalletOverviewBillStats {
  totalBills: number;
  paidBills: number;
  pendingBills: number;
  serviceFee: number;
}

interface EstateWalletOverviewCardProps {
  wallet: WalletOverviewWallet | null;
  billStats?: WalletOverviewBillStats | null;
  onWithdraw: () => void;
  onCreateWallet?: () => void;
  onSetWithdrawalAccount?: () => void;
  /** True while wallet fetch has not finished — avoid flashing Create Wallet. */
  walletLoading?: boolean;
  createWalletLoading?: boolean;
  filterExportSlot?: React.ReactNode;
  /** When set, embeds auto-settlement above the balance cards. */
  revenueSettlementRole?: RevenueWithdrawalRole;
}

const formatNaira = (value: number) => `₦${(value ?? 0).toLocaleString()}`;

function WalletBalancesAndActions({
  wallet,
  onWithdraw,
  onSetWithdrawalAccount,
  autoSettlement,
  autoSettlementEnabled = false,
}: Readonly<{
  wallet: WalletOverviewWallet;
  onWithdraw: () => void;
  onSetWithdrawalAccount?: () => void;
  autoSettlement?: React.ReactNode;
  autoSettlementEnabled?: boolean;
}>) {
  const hasWithdrawalAccount = Boolean(wallet.accountNumber?.trim());
  const showWithdrawFunds = hasWithdrawalAccount && !autoSettlementEnabled;
  const showSetWithdrawalAccount = !hasWithdrawalAccount;
  const showActions = showWithdrawFunds || showSetWithdrawalAccount;

  return (
    <div className="space-y-6">
      {autoSettlement}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:gap-6">
        {/* <div className="flex h-[150px] w-full flex-col items-center justify-center rounded-lg border border-[#CCCCCC] lg:px-4 lg:py-4">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <p className="mt-1 text-3xl font-bold md:text-4xl">
            {formatNaira(computeWalletTotalBalance(wallet))}
          </p>
        </div> */}
        <div className="flex h-[150px] w-full flex-col items-center justify-center rounded-lg border border-[#CCCCCC] lg:px-4 lg:py-4">
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="mt-1 text-3xl font-bold md:text-4xl">
            {formatNaira(wallet.availableBalance ?? 0)}
          </p>
        </div>
        <div className="flex h-[150px] w-full flex-col items-center justify-center rounded-lg border border-[#CCCCCC] lg:px-4 lg:py-4">
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Withdrawable Balance
            <span
              className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-muted text-xs text-muted-foreground"
              title="You can only withdraw from this balance."
            >
              i
            </span>
          </p>
          <p className="mt-1 text-3xl font-bold text-primary md:text-4xl">
            {formatNaira(wallet.withdrawableBalance ?? 0)}
          </p>
        </div>
      </div>

      {showActions ? (
        <div className="flex items-center justify-center rounded-lg bg-[#D0DFF233] p-4">
          {showWithdrawFunds ? (
            <Button
              onClick={onWithdraw}
              size="lg"
              className="w-full max-w-md px-8"
            >
              Withdraw Funds
            </Button>
          ) : (
            <Button
              onClick={onSetWithdrawalAccount}
              size="lg"
              className="w-full max-w-md px-8"
            >
              Set Withdrawal Account
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function EstateWalletOverviewCard({
  wallet,
  onWithdraw,
  onCreateWallet,
  onSetWithdrawalAccount,
  walletLoading = false,
  createWalletLoading = false,
  filterExportSlot,
  revenueSettlementRole,
}: EstateWalletOverviewCardProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4 shadow-md md:p-6">
        <div className="space-y-6 p-0">
          {wallet ? (
            revenueSettlementRole ? (
              <RevenueWithdrawalOverviewProvider role={revenueSettlementRole}>
                {(sections) => (
                  <WalletBalancesAndActions
                    wallet={wallet}
                    onWithdraw={onWithdraw}
                    onSetWithdrawalAccount={onSetWithdrawalAccount}
                    autoSettlement={sections.autoSettlement}
                    autoSettlementEnabled={sections.autoSettlementEnabled}
                  />
                )}
              </RevenueWithdrawalOverviewProvider>
            ) : (
              <WalletBalancesAndActions
                wallet={wallet}
                onWithdraw={onWithdraw}
                onSetWithdrawalAccount={onSetWithdrawalAccount}
              />
            )
          ) : walletLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Loading wallet...
            </p>
          ) : (
            <div className="flex justify-center py-4">
              <Button
                onClick={onCreateWallet}
                disabled={createWalletLoading}
                size="lg"
                className="px-8"
              >
                {createWalletLoading ? "Creating wallet..." : "Create Wallet"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {filterExportSlot && (
        <div className="flex flex-wrap items-center gap-2">
          {filterExportSlot}
        </div>
      )}
    </div>
  );
}

/** Presentational buttons for Filter by Ref / Filter by Status / Export. Use with filterExportSlot. */
export function WalletFilterExportBar({
  filterByRefLabel = "Filter by Ref",
  filterByStatusLabel = "Filter by Status",
  exportLabel = "Export",
  onFilterByRef,
  onFilterByStatus,
  onExport,
}: {
  filterByRefLabel?: string;
  filterByStatusLabel?: string;
  exportLabel?: string;
  onFilterByRef?: () => void;
  onFilterByStatus?: () => void;
  onExport?: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onFilterByRef}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
      >
        {filterByRefLabel}
        <ChevronDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onFilterByStatus}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
      >
        {filterByStatusLabel}
        <ChevronDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
      >
        {exportLabel}
      </button>
    </>
  );
}
