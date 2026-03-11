"use client";

import type React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/modal/page";
import WithdrawFundForm from "@/components/estate-admin/transactions/fund-wallet-form/page";
import EstateWalletOverviewCard, {
  WalletFilterExportBar,
} from "@/components/estate-admin/wallet-overview-card/page";
import {
  createWallet,
  getWallet,
  getEstateCredits,
} from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  verifyTransaction,
  transferFunds,
} from "@/redux/slice/estate-admin/transaction/transaction";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Table from "@/components/tables/list/page";
import type { EstateCreditItem } from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt-slice";
import { generateTxRef } from "@/redux/slice/estate-admin/payment/payment";

// Extend the type to include all fields from API
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
  const [userId, setUserId] = useState<string | null>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [creditsPage, setCreditsPage] = useState(1);
  const [limit] = useState(10);

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

  // Fetch user, wallet, and estate credits on mount
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data ?? (userRes as Record<string, unknown>) ?? null;
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

        // `userId` is only needed for withdrawal; don't block credits fetch on it.
        if (id) setUserId(id);

        if (!estateIdFromUser) {
          toast.error("No estate ID found for this user.");
          return;
        }
        setEstateId(estateIdFromUser);

        const walletRes = await dispatch(getWallet(estateIdFromUser)).unwrap();
        // if (!walletRes?.data?.id) {
        //   toast.warning("No wallet found for this estate.");
        // }

        await dispatch(
          getEstateCredits({
            estateId: estateIdFromUser,
            page: 1,
            limit,
          }),
        ).unwrap();
      } catch (err: any) {
        // When user does not have a wallet, do not show error toast
        const errorMessage =
          err?.message || err?.payload?.message || "Failed to load data.";
        // toast.error(errorMessage);
      }
    })();
  }, [dispatch, limit]);

  // Fetch estate credits when page changes
  useEffect(() => {
    if (!estateId || creditsPage === 1) return;
    dispatch(getEstateCredits({ estateId, page: creditsPage, limit }));
  }, [estateId, creditsPage, limit, dispatch]);

  const handleCreateWallet = async () => {
    if (!estateId) {
      toast.warning("No estate found.");
      return;
    }
    if (!createWalletAccountNumber.trim()) {
      toast.warning("Please enter the account number you want to withdraw to.");
      return;
    }
    try {
      await dispatch(
        createWallet({
          estateId,
          balance: 0,
          lockedBalance: 0,
          accountNumber: createWalletAccountNumber.trim(),
          // in the estate admin, to create wallet, {
    // "success": true,
    // "message": "Wallet created successfully.",
    // "data": {
    //     "estateId": "69b177244daf32b633ed9fc1",
    //     "balance": 0,
    //     "accountNumber": "01400444709",
    //     "temporaryBalance": 0,
    //     "lockedBalance": 0,
    //     "withdrawableBalance": 0,
    //     "availableBalance": 0,
    //     "bankCode": null,
    //     "id": "69b178194daf32b633eda06d",
    //     "createdAt": "2026-03-11T14:11:37.906Z",
    //     "updatedAt": "2026-03-11T14:11:37.906Z",
    //     "__v": 0
    // } bank code is needed
          // this is the api to get bank 
// /api/v1/payment-mgt/banks


// Parameters
// Try it out
// Name	Description
// country
// string
// (query)
// Country code (default NG)

// NG
// Responses
// Code	Description	Links
// 200 so add a input for the user to select bankthensend the bankcode as re
        }),
      ).unwrap();
      toast.success("Wallet created successfully.");
      setCreateWalletModalOpen(false);
      setCreateWalletAccountNumber("");
      await dispatch(getWallet(estateId));
    } catch (error: any) {
      toast.error(error?.message || "Failed to create wallet.");
    }
  };

  const handleOpenModal = () => setOpen((prev) => !prev);

  const handleWithdrawSubmit = async ({
    walletId,
    amount,
    description,
    type,
    currency,
    country,
    bankCode,
    accountNumber,
  }: {
    walletId: string;
    amount: number;
    description: string;
    type: "debit";
    currency: string;
    country: string;
    bankCode?: string;
    accountNumber?: string;
  }) => {
    try {
      if (!bankCode || !accountNumber) {
        toast.error(
          "Bank code and account number are required for withdrawal.",
        );
        return;
      }

      if (!estateId) {
        toast.error("Estate ID is required for withdrawal.");
        return;
      }

      // ✅ 1. Generate tx_ref and WAIT for it
      const txRefResponse = await dispatch(generateTxRef()).unwrap();

      const tx_ref = txRefResponse?.tx_ref;

      if (!tx_ref) {
        toast.error("Failed to generate transaction reference.");
        return;
      }

      // ✅ 2. Transfer funds using tx_ref
      await dispatch(
        transferFunds({
          estateId,
          amount,
          currency,
          bankCode,
          accountNumber,
          tx_ref, // 🔥 important
          narration: description || `Withdrawal of ${currency} ${amount}`,
        }),
      ).unwrap();

      toast.success("Fund withdrawal initiated successfully!");

      // ✅ 3. Refresh wallet + credits
      await dispatch(getWallet(estateId));
      await dispatch(getEstateCredits({ estateId, page: creditsPage, limit }));

      setOpen(false);
    } catch (err: any) {
      const errorMessage =
        err?.message || err?.payload?.message || "Failed to withdraw fund.";

      toast.error(errorMessage);
      throw err;
    }
  };

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
            limit,
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
  }, [dispatch, userId, estateId, creditsPage, limit]);

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
    // {
    //   key: "serviceCharge",
    //   header: "Service Charge (₦)",
    //   render: (item: ExtendedEstateCreditItem): React.ReactNode =>
    //     typeof item.serviceCharge === "number"
    //       ? Number(item.serviceCharge).toLocaleString()
    //       : "—",
    // },
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
    typeof pag?.limit === "number" ? pag.limit : Number(pag?.limit) || limit;

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

      {/* Wallet overview (Figma: balances + bill stats + Withdraw Funds) */}
      <EstateWalletOverviewCard
        wallet={wallet}
        billStats={
          // Replace with API data when estate bill summary is available
          { totalBills: 0, paidBills: 0, pendingBills: 0, serviceFee: 0 }
        }
        onWithdraw={handleOpenModal}
        onCreateWallet={() => setCreateWalletModalOpen(true)}
        createWalletLoading={createWalletState === "isLoading"}
        filterExportSlot={
          <WalletFilterExportBar
            onFilterByRef={() => {}}
            onFilterByStatus={() => {}}
            onExport={() => {}}
          />
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
          data={creditsData}
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
        {/* <div className="flex justify-end items-center gap-2 mt-4">
          <Button
            disabled={pageNum <= 1}
            onClick={() => setCreditsPage((p) => p - 1)}
          >
            Prev
          </Button>
          <Button
            disabled={
              pageNum >= (creditsPagination?.pages ?? 1) || total <= pageSize
            }
            onClick={() => setCreditsPage((p) => p + 1)}
          >
            Next
          </Button>
        </div> */}
      </Card>

      <Modal visible={open} onClose={handleOpenModal}>
        <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto">
          {userId && wallet ? (
            <WithdrawFundForm
              userId={userId}
              walletId={wallet.id ?? ""}
              defaultAccountNumber={wallet.accountNumber ?? ""}
              maxWithdrawableAmount={wallet.temporaryBalance}
              onSubmit={handleWithdrawSubmit}
              onClose={handleOpenModal}
            />
          ) : (
            <p className="text-center text-gray-500">Loading form...</p>
          )}
        </div>
      </Modal>

      <Modal
        visible={createWalletModalOpen}
        onClose={() => {
          setCreateWalletModalOpen(false);
          setCreateWalletAccountNumber("");
        }}
      >
        <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto mt-12 pb-8 px-6">
          <h2 className="text-lg font-semibold mb-4">Create Wallet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your withdrawal will be sent to this account number. This
            information is automatically filled in from your Withdrawal from.
          </p>
          <div className="space-y-4">
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
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWallet}
                disabled={
                  createWalletState === "isLoading" ||
                  !createWalletAccountNumber.trim()
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
