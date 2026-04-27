"use client";

import type React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/modal/page";
import WithdrawFundForm from "@/components/estate-admin/transactions/fund-wallet-form/page";
import EstateWalletOverviewCard from "@/components/estate-admin/wallet-overview-card/page";
import {
  createWallet,
  getWallet,
  getEstateCredits,
} from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt";
import { getBanks } from "@/redux/slice/estate-admin/fund-wallet/fund-wallet";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { verifyTransaction } from "@/redux/slice/estate-admin/transaction/transaction";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Table from "@/components/tables/list/page";
import type { EstateCreditItem } from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt-slice";
import { TransactionsFilterBar } from "@/components/super-admin/transactions-filter-bar";

const LIMIT = 10;
interface ExtendedEstateCreditItem extends EstateCreditItem {
  serviceCharge?: number;
  source?: string;
}

export default function EstateAdminWalletPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [createWalletModalOpen, setCreateWalletModalOpen] = useState(false);
  const [createWalletAccountNumber, setCreateWalletAccountNumber] =
    useState("");
  const [createWalletBankCode, setCreateWalletBankCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [creditsPage, setCreditsPage] = useState(1);

  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const wallet = useSelector(
    (state: RootState) => state.estateAdminWallet?.wallet ?? null,
  );
  const createWalletState = useSelector(
    (state: RootState) => state.estateAdminWallet?.createWalletState ?? "idle",
  );
  const estateCredits = useSelector(
    (state: RootState) => state.estateAdminWallet?.estateCredits ?? null,
  );
  const creditsLoading =
    useSelector(
      (state: RootState) =>
        state.estateAdminWallet?.getEstateCreditsState === "isLoading",
    ) ?? false;

  const creditsData = estateCredits?.data ?? [];
  const creditsPagination = estateCredits?.pagination ?? null;

  const { txRef, loading, error } = useSelector(
    (state: RootState) => state.payment,
  );
  const { banks, getBanksState } = useSelector(
    (state: RootState) => state.estateAdminFundWallet,
  );
  const loadingBanks = getBanksState === "isLoading";

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user =
          userRes?.data ?? (userRes as Record<string, unknown>) ?? null;
        const id = user?.id || user?._id || null;
        const rawEstateId =
          (user?.estateId as string | { id?: string; _id?: string }) || null;
        const estateIdFromUser =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id || rawEstateId?.id || null;

        const estateFromId =
          (user?.estateId as { name?: string } | undefined)?.name ?? "";
        const estateFromObj =
          (user?.estate as { name?: string } | undefined)?.name ?? "";
        const fallbackEstateName = (user?.estateName as string) ?? "";
        const name =
          estateFromId || estateFromObj || fallbackEstateName || "Estate";
        setEstateName(name);

        if (id) setUserId(id);

        if (!estateIdFromUser) {
          toast.error("No estate ID found for this user.");
          return;
        }
        setEstateId(estateIdFromUser);

        await dispatch(getWallet(estateIdFromUser)).unwrap();

        await dispatch(
          getEstateCredits({
            estateId: estateIdFromUser,
            page: 1,
            limit: LIMIT,
          }),
        ).unwrap();
      } catch (err: any) {
        // When user does not have a wallet, do not show error toast
      }
    })();
  }, [dispatch]);
  useEffect(() => {
    if (!estateId || creditsPage === 1) return;
    dispatch(getEstateCredits({ estateId, page: creditsPage, limit: LIMIT }));
  }, [estateId, creditsPage, dispatch]);

  useEffect(() => {
    dispatch(getBanks("NG"));
  }, [dispatch]);

  const handleCreateWallet = async () => {
    if (!estateId) {
      toast.warning("No estate found.");
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
        createWallet({
          estateId,
          balance: 0,
          lockedBalance: 0,
          accountNumber: createWalletAccountNumber.trim(),
          bankCode: createWalletBankCode.trim(),
        }),
      ).unwrap();
      toast.success("Wallet created successfully.");
      setCreateWalletModalOpen(false);
      setCreateWalletAccountNumber("");
      setCreateWalletBankCode("");
      await dispatch(getWallet(estateId));
    } catch (error: any) {
      toast.error(error?.message || "Failed to create wallet.");
    }
  };

  const handleOpenModal = () => setOpen((prev) => !prev);

  const walletBankName =
    wallet && wallet.bankCode
      ? (banks.find((b) => b.code === wallet.bankCode)?.name ?? "")
      : "";

  // Verify transaction when redirected back from payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tx_ref = urlParams.get("tx_ref") || urlParams.get("trx_ref");
    if (!tx_ref) return;

    const verifyTransactionAsync = async () => {
      try {
        let currentUserId = userId;
        let currentEstateId = estateId;
        if (!currentUserId || !currentEstateId) {
          const userRes = await dispatch(getSignedInUser()).unwrap();
          currentUserId = userRes?.data?.id;
          currentEstateId =
            userRes?.data?.estateId || userRes?.data?.estate?.id;
          setUserId(currentUserId ?? null);
          setEstateId(currentEstateId ?? null);
        }
        if (!currentUserId || !currentEstateId)
          throw new Error("User or estate not found");

        await dispatch(
          verifyTransaction({ tx_ref, paymentType: "withdrawFund" }),
        ).unwrap();
        toast.success("Withdrawal successful!");
        await dispatch(getWallet(currentEstateId));
        await dispatch(
          getEstateCredits({
            estateId: currentEstateId,
            page: creditsPage,
            limit: LIMIT,
          }),
        );

        const url = new URL(window.location.href);
        ["tx_ref", "trx_ref", "transaction_id", "status"].forEach((key) =>
          url.searchParams.delete(key),
        );
        window.history.replaceState({}, document.title, url.toString());
      } catch (err: any) {
        toast.error(
          err?.message || err?.payload?.message || "Verification failed",
        );
      }
    };
    const timer = setTimeout(verifyTransactionAsync, 800);
    return () => clearTimeout(timer);
  }, [dispatch, userId, estateId, creditsPage]);

  const creditsColumns: Array<{
    key: string;
    header: string;
    render: (item: ExtendedEstateCreditItem) => React.ReactNode;
  }> = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: ExtendedEstateCreditItem): React.ReactNode =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleString("en-NG", {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (item: ExtendedEstateCreditItem): React.ReactNode =>
        typeof item.amount === "number"
          ? Number(item.amount).toLocaleString()
          : "—",
    },
    {
      key: "tx_ref",
      header: "Transaction Reference",
      render: (item: ExtendedEstateCreditItem): React.ReactNode =>
        typeof item.tx_ref === "string" ? item.tx_ref : "—",
    },
    {
      key: "source",
      header: "Source",
      render: (item: ExtendedEstateCreditItem): React.ReactNode =>
        typeof item.source === "string" ? item.source : "—",
    },
    {
      key: "description",
      header: "Description",
      render: (item: ExtendedEstateCreditItem): React.ReactNode =>
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
  const pageSize =
    typeof pag?.limit === "number" ? pag.limit : Number(pag?.limit) || LIMIT;

  const handleCreditsFiltersChange = (filters: {
    fromDate: string | null;
    toDate: string | null;
    estate: string;
    type: string;
  }) => {
    setFromDate(filters.fromDate);
    setToDate(filters.toDate);
    setSourceFilter(filters.estate);
    setTypeFilter(filters.type);
  };

  const filteredCreditsData = (
    creditsData as ExtendedEstateCreditItem[]
  ).filter((item) => {
    const createdAt = item.createdAt ? new Date(item.createdAt) : null;

    if (fromDate) {
      const from = new Date(fromDate);
      if (!createdAt || createdAt < from) return false;
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (!createdAt || createdAt > to) return false;
    }

    if (typeFilter) {
      const itemType = (item as any).type as string | undefined;
      if (!itemType || itemType.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }
    }

    if (sourceFilter.trim()) {
      const src = (item.source || "") as string;
      if (!src.toLowerCase().includes(sourceFilter.trim().toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Wallet Management</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's is an overview on{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {estateName}
          </span>
          .
        </p>
      </div>

      {/* Wallet overview */}
      <EstateWalletOverviewCard
        wallet={wallet}
        billStats={{
          totalBills: 0,
          paidBills: 0,
          pendingBills: 0,
          serviceFee: 0,
        }}
        onWithdraw={handleOpenModal}
        onCreateWallet={() => setCreateWalletModalOpen(true)}
        createWalletLoading={createWalletState === "isLoading"}
        filterExportSlot={
          <div className="space-y-3">
            <TransactionsFilterBar
              fromDate={fromDate}
              toDate={toDate}
              estate={sourceFilter}
              type={typeFilter}
              onFiltersChange={handleCreditsFiltersChange}
              searchPlaceholder="Filter by source"
              searchFieldLabel="Source"
            />
          </div>
        }
      />

      {/* Estate Credits Table */}
      <Card className="p-4">
        <h2 className="font-semibold">Estate Credits</h2>
        <p className="text-sm text-muted-foreground">
          Amounts credited to wallets in this estate.
        </p>
        <Table<ExtendedEstateCreditItem>
          columns={creditsColumns}
          data={filteredCreditsData}
          emptyMessage={
            creditsLoading ? "Loading estate credits..." : "No credits found."
          }
          showPagination
          paginationInfo={{
            total,
            current: pageNum,
            pageSize,
          }}
          onPageChange={setCreditsPage}
          enableExport
          exportFileName="estate-credits"
          onExportRequest={
            estateId
              ? async () => {
                  const res = await dispatch(
                    getEstateCredits({ estateId, page: 1, limit: 50000 }),
                  ).unwrap();
                  return res?.data ?? [];
                }
              : undefined
          }
        />
      </Card>

      {/* Withdraw Modal */}
      <Modal visible={open} onClose={handleOpenModal}>
        <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto">
          {userId && wallet ? (
            <WithdrawFundForm
              userId={userId}
              walletId={wallet.id ?? ""}
              estateId={estateId ?? ""}
              defaultAccountNumber={wallet.accountNumber ?? ""}
              bankCode={wallet.bankCode ?? ""}
              bankName={walletBankName}
              maxWithdrawableAmount={
                wallet.withdrawableBalance ?? wallet.temporaryBalance ?? 0
              }
              onClose={handleOpenModal}
            />
          ) : (
            <p className="text-center text-gray-500">Loading form...</p>
          )}
        </div>
      </Modal>

      {/* Create Wallet Modal */}
      <Modal
        visible={createWalletModalOpen}
        onClose={() => {
          setCreateWalletModalOpen(false);
          setCreateWalletAccountNumber("");
          setCreateWalletBankCode("");
        }}
      >
        <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto mt-12 pb-8 px-6">
          <h2 className="text-lg font-semibold mb-4">Create Wallet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your withdrawal will be sent to this account number. Select the bank
            and enter the account number.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-wallet-bank">Bank</Label>
              <select
                id="create-wallet-bank"
                value={createWalletBankCode}
                onChange={(e) => setCreateWalletBankCode(e.target.value)}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={loadingBanks}
                aria-label="Select bank"
              >
                <option value="">
                  {loadingBanks ? "Loading banks..." : "Select bank"}
                </option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="create-wallet-account">Account Number</Label>
              <Input
                id="create-wallet-account"
                type="text"
                value={createWalletAccountNumber}
                onChange={(e) => setCreateWalletAccountNumber(e.target.value)}
                placeholder="e.g. 0002299900"
                className="mt-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateWalletModalOpen(false);
                  setCreateWalletAccountNumber("");
                  setCreateWalletBankCode("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWallet}
                disabled={
                  createWalletState === "isLoading" ||
                  !createWalletAccountNumber.trim() ||
                  !createWalletBankCode.trim() ||
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
    </div>
  );
}
