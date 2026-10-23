"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import EstateWalletOverviewCard from "@/components/estate-admin/wallet-overview-card/page";
import SetWithdrawalAccountModal from "@/components/wallet/SetWithdrawalAccountModal";
import RevenueWithdrawalAccountsCard from "@/components/wallet/RevenueWithdrawalAccountsCard";
import EnergyProviderWithdrawFundForm from "@/components/energy-provider/wallet/EnergyProviderWithdrawFundForm";
import { formatDateTime } from "@/lib/format-date";
import {
  extractEstateIdFromUser,
  extractEstateNameFromUser,
  extractUserId,
} from "@/lib/user-id";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  getBanks,
  verifyBankAccount,
} from "@/redux/slice/estate-admin/fund-wallet/fund-wallet";
import type { BankItem } from "@/redux/slice/estate-admin/fund-wallet/fund-wallet";
import { clearVerifiedAccount } from "@/redux/slice/estate-admin/fund-wallet/fund-wallet-slice";
import {
  createEnergyProviderWallet,
  getEnergyProviderWallet,
  getEnergyProviderCredits,
} from "@/redux/slice/energy-provider/wallet-mgt/energy-provider-wallet-mgt";
import {
  selectEnergyProviderCredits,
  selectEnergyProviderCreditsPagination,
  selectEnergyProviderWallet,
} from "@/redux/slice/energy-provider/wallet-mgt/energy-provider-wallet-mgt-slice";
import type { EnergyProviderCreditItem } from "@/redux/slice/energy-provider/wallet-mgt/energy-provider-wallet-mgt-slice";
import type { AppDispatch, RootState } from "@/redux/store";
import { isPending } from "@/lib/async-status";
import Loader from "@/components/ui/Loader";

const LIMIT = 10;

type SortBy = "amount" | "date";
type SortOrder = "asc" | "desc";

function dedupeBanksByCode(banks: BankItem[]): BankItem[] {
  const seen = new Set<string>();
  return banks.filter((bank) => {
    if (seen.has(bank.code)) return false;
    seen.add(bank.code);
    return true;
  });
}

export default function EnergyProviderWalletPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [createWalletModalOpen, setCreateWalletModalOpen] = useState(false);
  const [setWithdrawalAccountModalOpen, setSetWithdrawalAccountModalOpen] =
    useState(false);
  const [createWalletAccountNumber, setCreateWalletAccountNumber] =
    useState("");
  const [createWalletBankCode, setCreateWalletBankCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [creditsPage, setCreditsPage] = useState(1);
  const [pageSize, setPageSize] = useState(LIMIT);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const wallet = useSelector(selectEnergyProviderWallet);
  const creditsData = useSelector(selectEnergyProviderCredits);
  const creditsPagination = useSelector(selectEnergyProviderCreditsPagination);
  const getWalletState = useSelector(
    (state: RootState) =>
      state.energyProviderWallet?.getWalletState ?? "idle",
  );
  const getCreditsState = useSelector(
    (state: RootState) =>
      state.energyProviderWallet?.getCreditsState ?? "idle",
  );
  const walletLoading = isPending(getWalletState);
  const creditsLoading = isPending(getCreditsState);
  const createWalletState = useSelector(
    (state: RootState) =>
      state.energyProviderWallet?.createWalletState ?? "idle",
  );
  const pageLoading = walletLoading || (!!userId && creditsLoading);

  const {
    banks,
    getBanksState,
    verifyBankAccountState,
    verifiedAccountName,
    error: verifyError,
  } = useSelector((state: RootState) => state.estateAdminFundWallet);

  const loadingBanks = getBanksState === "isLoading";
  const bankOptions = useMemo(() => dedupeBanksByCode(banks), [banks]);
  const verifyingAccount = verifyBankAccountState === "isLoading";
  const accountVerified =
    verifyBankAccountState === "succeeded" && !!verifiedAccountName;

  const fetchCredits = useCallback(
    (page: number, limit = pageSize) => {
      if (!userId) return Promise.resolve();
      return dispatch(
        getEnergyProviderCredits({
          userId,
          estateId: estateId ?? undefined,
          page,
          limit,
          sortBy,
          sortOrder,
        }),
      ).unwrap();
    },
    [dispatch, userId, estateId, pageSize, sortBy, sortOrder],
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const id = extractUserId(data);
        const estate = extractEstateIdFromUser(data);

        if (!id) {
          toast.error("No user ID found for this account.");
          return;
        }

        setUserId(id);
        if (estate) setEstateId(estate);
        setEstateName(extractEstateNameFromUser(data) ?? "Estate");

        await dispatch(getEnergyProviderWallet(id)).unwrap().catch(() => {});
      } catch {
        // wallet may not exist yet
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!userId) return;
    fetchCredits(creditsPage).catch(() => {});
  }, [userId, creditsPage, sortBy, sortOrder, fetchCredits]);

  useEffect(() => {
    dispatch(getBanks({ country: "NG", gatewayType: "flutterwave" }));
  }, [dispatch]);

  useEffect(() => {
    if (
      !createWalletModalOpen ||
      createWalletAccountNumber.trim().length < 10 ||
      !createWalletBankCode
    ) {
      return;
    }

    const timeoutId = setTimeout(() => {
      dispatch(
        verifyBankAccount({
          accountNumber: createWalletAccountNumber.trim(),
          bankCode: createWalletBankCode,
          gatewayType: "flutterwave",
        }),
      );
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    createWalletModalOpen,
    createWalletAccountNumber,
    createWalletBankCode,
    dispatch,
  ]);

  const resetCreateWalletForm = () => {
    setCreateWalletAccountNumber("");
    setCreateWalletBankCode("");
    dispatch(clearVerifiedAccount());
  };

  const handleCloseCreateWalletModal = () => {
    setCreateWalletModalOpen(false);
    resetCreateWalletForm();
  };

  const handleCreateWallet = async () => {
    if (!accountVerified) {
      if (verifyError) toast.error(verifyError);
      return;
    }
    if (!createWalletAccountNumber.trim()) {
      toast.warning("Please enter the account number you want to withdraw to.");
      return;
    }
    if (!createWalletBankCode.trim()) {
      toast.warning("Please select a bank.");
      return;
    }
    try {
      await dispatch(
        createEnergyProviderWallet({
          balance: 0,
          accountNumber: createWalletAccountNumber.trim(),
          bankCode: createWalletBankCode.trim(),
        }),
      ).unwrap();
      toast.success("Wallet created successfully.");
      handleCloseCreateWalletModal();
      if (userId) {
        await dispatch(getEnergyProviderWallet(userId));
        await fetchCredits(1);
        setCreditsPage(1);
      }
    } catch (error: unknown) {
      toast.error(
        (error as { message?: string })?.message || "Failed to create wallet.",
      );
    }
  };

  const creditsColumns: Array<{
    key: string;
    header: string;
    render: (item: EnergyProviderCreditItem) => React.ReactNode;
  }> = [
    {
      key: "createdAt",
      header: "Date",
      render: (item) => formatDateTime(item.createdAt),
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (item) =>
        typeof item.amount === "number"
          ? Number(item.amount).toLocaleString()
          : "—",
    },
    {
      key: "type",
      header: "Type",
      render: (item) => (typeof item.type === "string" ? item.type : "—"),
    },
    {
      key: "tx_ref",
      header: "Transaction Reference",
      render: (item) => (typeof item.tx_ref === "string" ? item.tx_ref : "—"),
    },
    {
      key: "source",
      header: "Source",
      render: (item) => (typeof item.source === "string" ? item.source : "—"),
    },
    {
      key: "description",
      header: "Description",
      render: (item) =>
        typeof item.description === "string" ? item.description : "—",
    },
  ];

  const pag = creditsPagination as
    | { total?: number; page?: number; limit?: number; pages?: number }
    | undefined;
  const total =
    typeof pag?.total === "number" ? pag.total : Number(pag?.total) || 0;
  const pageNum =
    typeof pag?.page === "number" ? pag.page : Number(pag?.page) || creditsPage;

  const walletBankName =
    wallet?.bankCode
      ? (bankOptions.find((b) => b.code === wallet.bankCode)?.name ?? "")
      : "";

  const handleOpenWithdraw = () => {
    if (!wallet) {
      toast.warning("Create a wallet before withdrawing funds.");
      return;
    }
    if (!estateId) {
      toast.error("No estate linked to your account.");
      return;
    }
    setWithdrawOpen(true);
  };

  return (
    <div className="relative space-y-6">
      {pageLoading && <Loader fullScreen label="Loading wallet..." />}

      <div
        className={[
          "space-y-6",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Wallet Management</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here is an overview for{" "}
            <span className="text-[18px] font-bold underline uppercase text-black">
              {estateName}
            </span>
            .
          </p>
        </div>
        <RevenueWithdrawalAccountsCard
          role="energyProvider"
          className="w-full shrink-0 sm:w-auto"
        />
      </div>

      <EstateWalletOverviewCard
        wallet={wallet}
        onWithdraw={handleOpenWithdraw}
        onCreateWallet={() => setCreateWalletModalOpen(true)}
        onSetWithdrawalAccount={() => setSetWithdrawalAccountModalOpen(true)}
        createWalletLoading={createWalletState === "isLoading"}
        revenueSettlementRole="energyProvider"
      />

      <Card className="p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold">Wallet History</h2>
            <p className="text-sm text-muted-foreground">
              Credits and withdrawals for your energy provider wallet.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="credits-sort-by" className="text-xs">
                Sort by
              </Label>
              <select
                id="credits-sort-by"
                value={sortBy}
                aria-label="Sort wallet history by"
                onChange={(e) => {
                  setSortBy(e.target.value as SortBy);
                  setCreditsPage(1);
                }}
                className="mt-1 flex h-9 w-full min-w-[7rem] rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
              </select>
            </div>
            <div>
              <Label htmlFor="credits-sort-order" className="text-xs">
                Order
              </Label>
              <select
                id="credits-sort-order"
                value={sortOrder}
                aria-label="Sort wallet history order"
                onChange={(e) => {
                  setSortOrder(e.target.value as SortOrder);
                  setCreditsPage(1);
                }}
                className="mt-1 flex h-9 w-full min-w-[7rem] rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        <Table<EnergyProviderCreditItem>
          columns={creditsColumns}
          data={creditsData}
          emptyMessage={
            creditsLoading ? "Loading wallet history..." : "No transactions found."
          }
          showPagination
          paginationInfo={{
            total,
            current: pageNum,
            pageSize,
          }}
          onPageChange={setCreditsPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCreditsPage(1);
          }}
          enableExport
          exportFileName="energy-provider-wallet-history"
          onExportRequest={
            userId
              ? async () => {
                  const res = await dispatch(
                    getEnergyProviderCredits({
                      userId,
                      estateId: estateId ?? undefined,
                      page: 1,
                      limit: 50000,
                      sortBy,
                      sortOrder,
                    }),
                  ).unwrap();
                  return res?.data ?? [];
                }
              : undefined
          }
        />
      </Card>

      <Modal visible={withdrawOpen} onClose={() => setWithdrawOpen(false)}>
        <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto">
          {userId && wallet && estateId ? (
            <EnergyProviderWithdrawFundForm
              userId={userId}
              walletId={wallet.id ?? ""}
              estateId={estateId}
              defaultAccountNumber={wallet.accountNumber ?? ""}
              bankCode={wallet.bankCode ?? ""}
              bankName={walletBankName}
              maxWithdrawableAmount={
                wallet.withdrawableBalance ?? wallet.temporaryBalance ?? 0
              }
              creditsPage={creditsPage}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onClose={() => setWithdrawOpen(false)}
            />
          ) : (
            <p className="text-center text-gray-500 p-6">Loading form...</p>
          )}
        </div>
      </Modal>

      <Modal visible={createWalletModalOpen} onClose={handleCloseCreateWalletModal}>
        <div className="rounded-md shadow-md w-full max-w-md mx-auto mt-12 pb-8 px-4">
          <h2 className="text-lg font-semibold mb-4">Create Wallet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your withdrawal will be sent to this account number. Select the bank
            and enter the account number.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-energy-provider-wallet-bank">Bank</Label>
              <select
                id="create-energy-provider-wallet-bank"
                value={createWalletBankCode}
                onChange={(e) => {
                  setCreateWalletBankCode(e.target.value);
                  dispatch(clearVerifiedAccount());
                }}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={loadingBanks}
                aria-label="Select bank"
              >
                <option value="">
                  {loadingBanks ? "Loading banks..." : "Select bank"}
                </option>
                {bankOptions.map((bank) => (
                  <option key={bank.id} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="create-energy-provider-wallet-account">
                Account Number
              </Label>
              <Input
                id="create-energy-provider-wallet-account"
                type="text"
                inputMode="numeric"
                value={createWalletAccountNumber}
                onChange={(e) => {
                  const value = e.target.value.replaceAll(/\D/g, "").slice(0, 10);
                  setCreateWalletAccountNumber(value);
                  dispatch(clearVerifiedAccount());
                }}
                placeholder="e.g. 0002299900"
                className="mt-2"
                maxLength={10}
              />
              {verifyingAccount &&
                createWalletAccountNumber.trim() &&
                createWalletBankCode && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Verifying account...
                  </p>
                )}
              {accountVerified && !verifyingAccount && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Account name: {verifiedAccountName}
                </p>
              )}
              {verifyBankAccountState === "failed" &&
                verifyError &&
                !verifyingAccount &&
                createWalletAccountNumber.trim().length >= 10 &&
                createWalletBankCode && (
                  <p className="text-sm text-red-600 mt-1">{verifyError}</p>
                )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCloseCreateWalletModal}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateWallet}
                disabled={
                  createWalletState === "isLoading" ||
                  !createWalletAccountNumber.trim() ||
                  !createWalletBankCode.trim() ||
                  !accountVerified ||
                  loadingBanks
                }
              >
                {createWalletState === "isLoading"
                  ? "Creating..."
                  : "Create Wallet"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <SetWithdrawalAccountModal
        visible={setWithdrawalAccountModalOpen}
        onClose={() => setSetWithdrawalAccountModalOpen(false)}
        onSuccess={() => {
          if (userId) dispatch(getEnergyProviderWallet(userId));
        }}
      />
      </div>
    </div>
  );
}
