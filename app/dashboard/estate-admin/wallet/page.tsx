"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import WithdrawFundForm from "@/components/estate-admin/transactions/fund-wallet-form/page";
import {
  createWallet,
  getWallet,
  getEstateCredits,
} from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  createTransaction,
  verifyTransaction,
  transferFunds,
} from "@/redux/slice/estate-admin/transaction/transaction";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Table from "@/components/tables/list/page";
import type { EstateCreditItem } from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt-slice";

// Extend the type to include all fields from API
interface ExtendedEstateCreditItem extends EstateCreditItem {
  serviceCharge?: number;
  source?: string;
}

export default function EstateAdminWalletPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
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

  // Fetch user, wallet, and estate credits on mount
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data ?? null;
        const id = user?.id || user?._id || null;
        const estateIdFromUser =
          user?.estateId || user?.estate?._id || user?.estate?.id || null;

        // `userId` is only needed for withdrawal; don't block credits fetch on it.
        if (id) setUserId(id);

        if (!estateIdFromUser) {
          toast.error("No estate ID found for this user.");
          return;
        }
        setEstateId(estateIdFromUser);

        const walletRes = await dispatch(getWallet(estateIdFromUser)).unwrap();
        if (!walletRes?.data?.id) {
          toast.warning("No wallet found for this estate.");
        }

        await dispatch(
          getEstateCredits({
            estateId: estateIdFromUser,
            page: 1,
            limit,
          }),
        ).unwrap();
      } catch (err) {
        toast.error("Failed to load data.");
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
      toast.warning("No estate found for this user.");
      return;
    }
    try {
      await dispatch(
        createWallet({ estateId, balance: 0, lockedBalance: 0 }),
      ).unwrap();
      toast.success("Wallet created successfully.");
      if (estateId) dispatch(getWallet(estateId));
    } catch (error: any) {
      toast.error(error?.message || "Failed to create wallet.");
    }
  };

  const handleOpenModal = () => setOpen((prev) => !prev);

  const handleWithdrawSubmit = async ({
    userId,
    walletId,
    amount,
    description,
    type,
    currency,
    country,
    bankCode,
    accountNumber,
  }: {
    userId: string;
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
      const reference = `withdraw_${userId}_${Date.now()}`;
      const txRes = await dispatch(
        createTransaction({ userId, walletId, amount, description, type }),
      ).unwrap();
      const tx_ref = txRes?.data?.tx_ref || reference;

      await dispatch(
        transferFunds({
          amount,
          currency,
          narration: description || `Withdrawal of ${currency} ${amount}`,
          bankCode,
          accountNumber,
          reference: tx_ref,
        }),
      ).unwrap();

      toast.success("Fund withdrawal initiated successfully!");
      if (estateId) {
        await dispatch(getWallet(estateId));
        await dispatch(
          getEstateCredits({ estateId, page: creditsPage, limit }),
        );
      }
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

  const creditsColumns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: ExtendedEstateCreditItem) =>
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
      render: (item: ExtendedEstateCreditItem) =>
        typeof item.amount === "number"
          ? Number(item.amount).toLocaleString()
          : "—",
    },
    {
      key: "serviceCharge",
      header: "Service Charge (₦)",
      render: (item: ExtendedEstateCreditItem) =>
        typeof item.serviceCharge === "number"
          ? Number(item.serviceCharge).toLocaleString()
          : "—",
    },
    {
      key: "source",
      header: "Source",
      render: (item: ExtendedEstateCreditItem) => item.source ?? "—",
    },
    {
      key: "description",
      header: "Description",
      render: (item: ExtendedEstateCreditItem) => item.description ?? "—",
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
      <Card className="p-6 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">My Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          {wallet ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-4xl font-bold mt-1">
                  ₦{wallet?.balance?.toLocaleString() ?? 0}
                </p>
              </div>
              <Button onClick={handleOpenModal} size="lg" className="px-6">
                Withdraw Fund
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleCreateWallet}
              disabled={createWalletState === "isLoading"}
            >
              {createWalletState === "isLoading"
                ? "Creating wallet..."
                : "Create Wallet"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-4">Estate Credits</h2>
        <p className="text-sm text-muted-foreground mb-4">
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
        />
        <div className="flex justify-end items-center gap-2 mt-4">
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
        </div>
      </Card>

      <Modal visible={open} onClose={handleOpenModal}>
        <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto">
          {userId && wallet ? (
            <WithdrawFundForm
              userId={userId}
              walletId={wallet.id ?? ""}
              onSubmit={handleWithdrawSubmit}
              onClose={handleOpenModal}
            />
          ) : (
            <p className="text-center text-gray-500">Loading form...</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
