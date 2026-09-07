"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FundWalletModal from "@/components/resident/transaction/fund-wallet-modal/page";
import WithdrawModal from "@/components/resident/transaction/withdraw-modal/page";
import TransferToBalanceModal from "@/components/resident/transaction/transfer-to-balance-modal/page";
import CreateWalletModalWrapper from "@/components/resident/transaction/create-wallet-modal-wrapper/page";
import SetWithdrawalAccountModal from "@/components/wallet/SetWithdrawalAccountModal";

import {
  createWallet,
  getWallet,
  transferToBalance,
} from "@/redux/slice/resident/wallet-mgt/wallet-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  createTransaction,
  initializePayment,
  verifyTransaction,
  getTransactionHistory,
} from "@/redux/slice/resident/transaction/transaction";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { getBanks as getResidentBanks, getPaymentGateways } from "@/redux/slice/resident/payment-mgt/payment-mgt";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Table from "@/components/tables/list/page";
import type { WalletData } from "@/redux/slice/resident/wallet-mgt/wallet-mgt-slice";
import Loader from "@/components/ui/Loader";
import { CopyButton } from "@/components/ui/copy-button";
import { ResidentWalletCard } from "@/components/resident/wallet/ResidentWalletCard";
import {
  ResidentVirtualAccountProvider,
  ResidentVirtualAccountSetupButton,
  ResidentVirtualAccountCard,
} from "@/components/resident/wallet/ResidentVirtualAccountCard";
import { formatDateTime } from "@/lib/format-date";
import { isPending } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";

interface TransactionData {
  walletId: string;
  type: string;
  amount: number;
  description: string;
  userId: string;
  id?: string;
  paymentStatus?: string;
  gatewayType?: string;
  tx_ref?: string;
  createdAt?: string;
  updatedAt?: string;
}

const formatNaira = (value: number) => `₦${(value ?? 0).toLocaleString()}`;

export default function TransactionPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [transferToBalanceModalOpen, setTransferToBalanceModalOpen] =
    useState(false);
  const [transferToBalanceLoading, setTransferToBalanceLoading] = useState(false);
  const [createWalletModalOpen, setCreateWalletModalOpen] = useState(false);
  const [setWithdrawalAccountModalOpen, setSetWithdrawalAccountModalOpen] =
    useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [residentType, setResidentType] = useState<string | null>(null);
  const [ownerEstateId, setOwnerEstateId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [continuingPaymentTxRef, setContinuingPaymentTxRef] = useState<string | null>(null);
  const transactions = useSelector(
    (state: RootState) => state.residentTransaction.allTransactions?.data || [],
  );
  const pagination = useSelector(
    (state: RootState) => state.residentTransaction.allTransactions?.pagination,
  );
  const wallet = useSelector((state: RootState) => state.wallet.wallet) as WalletData | null;
  const getWalletState = useSelector(
    (state: RootState) => state.wallet.getWalletState,
  );
  const createWalletState = useSelector(
    (state: RootState) => state.wallet.createWalletState,
  );
  const residentBanks = useSelector(
    (state: RootState) => state.residentPaymentMgt.banks,
  );
  const getTransactionHistoryState = useSelector(
    (state: RootState) =>
      state.residentTransaction.getTransactionHistoryState,
  );
  const walletLoading = isPending(getWalletState);
  const loading =
    isPending(getTransactionHistoryState) || walletLoading;

  // 🔹 Fetch signed-in user and wallet on mount
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const id = userRes?.data?.id;
        const userEmail = userRes?.data?.email;
        const rType =
          userRes?.data?.residentType ??
          userRes?.data?.resident_type ??
          null;
        const rawEstateId =
          userRes?.data?.estateId ?? userRes?.data?.estate_id ?? null;
        const estateId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : (rawEstateId as { id?: string; _id?: string })?._id ||
              (rawEstateId as { id?: string; _id?: string })?.id ||
              null;

        if (!id) {
          toast.warning("No user found.");
          return;
        }

        setUserId(id);
        setEmail(userEmail || "");
        setResidentType(rType ?? null);
        setOwnerEstateId(estateId ?? null);

        const [walletRes] = await Promise.all([
          dispatch(getWallet(id)).unwrap(),
          dispatch(getTransactionHistory({ userId: id, page: 1, limit })),
          dispatch(getResidentBanks({ country: "NG", gatewayType: "flutterwave" })),
        ]);

        if (!walletRes?.data?.id)
          toast.warning("No wallet found for this user.");
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    })();
  }, [dispatch, limit]);

  // 🔹 Pagination Handler
  const handlePageChange = async (newPage: number) => {
    if (!userId) return;
    setCurrentPage(newPage);
    await dispatch(getTransactionHistory({ userId, page: newPage, limit }));
  };

  // 🔹 Create Wallet: owners open modal for bank details; tenants create directly
  const isOwner = residentType === "owner";
  const handleCreateWalletClick = () => {
    if (!userId) return;
    if (isOwner) {
      setCreateWalletModalOpen(true);
    } else {
      handleCreateWalletDirect();
    }
  };
  const handleCreateWalletDirect = async () => {
    if (!userId) return;
    try {
      await dispatch(
        createWallet({ userId, balance: 0, lockedBalance: 0 }),
      ).unwrap();
      toast.success("Wallet created successfully.");
      dispatch(getWallet(userId));
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
      if (message) toast.error(message);
    }
  };
  const handleCreateWalletSuccess = () => {
    if (userId) dispatch(getWallet(userId));
  };

  const handleSetWithdrawalAccountSuccess = () => {
    if (userId) dispatch(getWallet(userId));
  };

  const handleOpenModal = () => setOpen((prev) => !prev);
  const handleOpenWithdrawModal = () => setWithdrawModalOpen(true);
  const handleCloseWithdrawModal = () => setWithdrawModalOpen(false);
  const handleOpenSetWithdrawalAccountModal = () =>
    setSetWithdrawalAccountModalOpen(true);
  const handleCloseSetWithdrawalAccountModal = () =>
    setSetWithdrawalAccountModalOpen(false);
  const handleOpenTransferToBalanceModal = () =>
    setTransferToBalanceModalOpen(true);
  const handleCloseTransferToBalanceModal = () => {
    setTransferToBalanceModalOpen(false);
    setTransferToBalanceLoading(false);
  };

  // Withdraw (owner only) handled via OTP flow inside WithdrawFundForm (generate-tx-ref + request OTP + withdraw)

  const handleTransferToMainBalance = async (payload: {
    amount: number;
    description?: string;
  }) => {
    if (!userId) return;
    if (!isOwner) {
      toast.error("Only owner accounts can transfer to main balance.");
      return;
    }
    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    const max = Number(wallet?.withdrawableBalance ?? 0);
    if (amount > max) {
      toast.error("Amount exceeds your withdrawable balance.");
      return;
    }

    try {
      setTransferToBalanceLoading(true);
      await dispatch(
        transferToBalance({
          amount,
          description: payload.description || undefined,
        }),
      ).unwrap();
      toast.success("Funds transferred to main balance.");
      await dispatch(getWallet(userId));
      handleCloseTransferToBalanceModal();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      setTransferToBalanceLoading(false);
    }
  };

  // 🔹 Continue payment for not-paid transaction
  const handleContinuePayment = async (item: {
    tx_ref?: string;
    amount?: number;
    description?: string;
  }) => {
    const tx_ref = item.tx_ref;
    if (!tx_ref || !email) {
      toast.error("Missing transaction reference or email.");
      return;
    }
    const amount = Number(item.amount) || 0;
    if (amount <= 0) {
      toast.error("Invalid amount.");
      return;
    }
    setContinuingPaymentTxRef(tx_ref);
    try {
      const gatewaysRes = await dispatch(getPaymentGateways()).unwrap();
      const gatewayType =
        gatewaysRes.defaultGateway || gatewaysRes.gateways[0]?.id;
      if (!gatewayType) {
        toast.error("No payment gateway available.");
        setContinuingPaymentTxRef(null);
        return;
      }

      const paymentRes = await dispatch(
        initializePayment({
          tx_ref,
          amount,
          country: "NG",
          currency: "NGN",
          redirect_url: `${window.location.origin}/dashboard/resident/transaction`,
          payment_options: "all",
          gatewayType,
          customer: { email },
          customizations: {
            title: "Wallet Funding",
            description: item.description || "Continue payment",
          },
        }),
      ).unwrap();

      const paymentUrl = paymentRes?.data?.link || paymentRes?.data?.url;
      if (!paymentUrl) throw new Error("Payment URL not received");
      window.location.assign(paymentUrl);
      setContinuingPaymentTxRef(null);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      setContinuingPaymentTxRef(null);
    }
  };

  // 🔹 Fund Wallet Handler
  const handleFundWallet = async ({
    userId,
    walletId,
    amount,
    description,
    type,
    currency,
    paymentOption,
    country,
    gatewayType,
  }: {
    userId: string;
    walletId: string;
    amount: number;
    description: string;
    type: "credit";
    currency: string;
    paymentOption: string;
    country: string;
    gatewayType: string;
  }) => {
    try {
      const txRes = await dispatch(
        createTransaction({ userId, walletId, amount, description, type }),
      ).unwrap();

      const tx_ref = txRes?.data?.tx_ref;
      if (!tx_ref) throw new Error("Transaction reference not found");

      const paymentRes = await dispatch(
        initializePayment({
          tx_ref,
          amount,
          country,
          currency,
          redirect_url: `${window.location.origin}/dashboard/resident/transaction`,
          payment_options: paymentOption,
          gatewayType,
          customer: { email },
          customizations: { title: "Wallet Funding", description },
        }),
      ).unwrap();

      const paymentUrl = paymentRes?.data?.link || paymentRes?.data?.url;
      if (!paymentUrl) throw new Error("Payment URL not received");

      window.location.assign(paymentUrl);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  // 🔹 Automatically verify transaction when redirected back
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tx_ref = urlParams.get("tx_ref") || urlParams.get("trx_ref");

    if (!tx_ref) return; // User didn’t come from Flutterwave

    const verifyTransactionAsync = async () => {
      try {
        // Wait for user info if not ready
        let currentUserId = userId;
        let currentEmail = email;

        if (!currentUserId) {
          const userRes = await dispatch(getSignedInUser()).unwrap();
          currentUserId = userRes?.data?.id;
          currentEmail = userRes?.data?.email || "";
          setUserId(currentUserId);
          setEmail(currentEmail);
        }

        if (!currentUserId) throw new Error("User not found for verification");

        // console.log("🧾 Auto-verifying transaction:", tx_ref);

        // ✅ Trigger verification via Redux thunk
        const verificationRes = await dispatch(
          verifyTransaction({ tx_ref, paymentType: "fundWallet" }),
        ).unwrap();

        // console.log("✅ Verification response:", verificationRes);
        toast.success("Wallet funded successfully!");

        // Refresh wallet balance
        await dispatch(getWallet(currentUserId));

        // Clean up URL params
        const url = new URL(window.location.href);
        ["tx_ref", "trx_ref", "transaction_id", "status"].forEach((key) =>
          url.searchParams.delete(key),
        );
        window.history.replaceState({}, document.title, url.toString());
      } catch (err: unknown) {
        // console.error("❌ Verification failed:", err);
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    };

    // Small delay helps ensure wallet/user state is loaded
    const timer = setTimeout(verifyTransactionAsync, 800);
    return () => clearTimeout(timer);
  }, [dispatch, userId, email]);

  // Table columns for transaction history
  const truncateText = (text: string, maxChars = 48) => {
    const value = text.trim();
    if (value.length <= maxChars) return value;
    return `${value.slice(0, maxChars).trimEnd()}…`;
  };

  const canContinuePayment = (item: {
    paymentStatus?: string;
    tx_ref?: string;
  }) => {
    const status = (item.paymentStatus ?? "").toString().toLowerCase();
    const isPending =
      !status ||
      status === "pending" ||
      status === "not-paid" ||
      status === "not_paid";
    return isPending && Boolean(item.tx_ref);
  };

  const showActionColumn = transactions.some(canContinuePayment);

  const columns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) =>
        formatDateTime(item.createdAt, "-"),
    },
    {
      key: "tx_ref",
      header: "Reference",
      render: (item: any) => {
        const ref =
          item.tx_ref ?? item.txRef ?? item.trx_ref ?? null;
        if (!ref) return "—";
        const value = String(ref);
        return (
          <div className="flex items-center gap-2 normal-case">
            <span
              title={value}
              className="inline-block max-w-[160px] truncate font-mono text-xs"
            >
              {value}
            </span>
            <CopyButton
              value={value}
              title="Copy transaction reference"
            />
          </div>
        );
      },
      exportValue: (item: any) =>
        String(item?.tx_ref ?? item?.txRef ?? item?.trx_ref ?? ""),
    },
    {
      key: "type",
      header: "Type",
      render: (item: any) =>
        item.type === "credit" ? (
          <span className="text-green-600 font-medium">Credit</span>
        ) : (
          <span className="text-red-600 font-medium">Debit</span>
        ),
    },
    {
      key: "description",
      header: "Description",
      render: (item: any) => {
        const description = (item.description ?? "").toString().trim();
        if (!description) return "—";
        return (
          <span
            title={description}
            className="inline-block max-w-[220px] truncate normal-case"
          >
            {truncateText(description, 48)}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (item: any) => item.amount?.toLocaleString() ?? 0,
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (item: any) => {
        const status = (item.paymentStatus ?? "").toString().toLowerCase();
        const isPaid = status === "paid" || status === "successful";
        const isFailed =
          status === "failed" ||
          status === "fail" ||
          status === "unsuccessful" ||
          status === "cancelled" ||
          status === "canceled";
        return (
          <span
            className={
              isPaid
                ? "text-green-600 font-medium capitalize"
                : isFailed
                  ? "text-red-600 font-medium capitalize"
                  : "text-yellow-600 font-medium capitalize"
            }
          >
            {item.paymentStatus || "Pending"}
          </span>
        );
      },
    },
    ...(showActionColumn
      ? [
          {
            key: "actions",
            header: "Action",
            exportable: false as const,
            render: (item: any) => {
              if (!canContinuePayment(item)) return null;
              return (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={continuingPaymentTxRef === item.tx_ref}
                  onClick={() => handleContinuePayment(item)}
                >
                  {continuingPaymentTxRef === item.tx_ref
                    ? "Redirecting..."
                    : "Continue payment"}
                </Button>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="relative">
      {loading && <Loader fullScreen label="Loading wallet..." />}

      <ResidentVirtualAccountProvider enabled={Boolean(userId)}>
        <div
          className={[
            "space-y-6",
            loading ? "pointer-events-none select-none" : "",
          ].join(" ")}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-lg font-bold text-black">
                Wallet Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your wallet and transactions.
              </p>
            </div>
            <ResidentVirtualAccountSetupButton />
          </div>

          <ResidentWalletCard
            wallet={wallet}
            isOwner={isOwner}
            formatNaira={formatNaira}
            walletLoading={walletLoading}
            createWalletState={String(createWalletState)}
            createWalletModalOpen={createWalletModalOpen}
            onFundWalletClick={handleOpenModal}
            onWithdrawClick={handleOpenWithdrawModal}
            onTransferToBalanceClick={handleOpenTransferToBalanceModal}
            onCreateWalletClick={handleCreateWalletClick}
            onSetWithdrawalAccountClick={handleOpenSetWithdrawalAccountModal}
          />

          <ResidentVirtualAccountCard />

          {/* Transactions Table */}
          <Card className="p-4">
            <h2 className="font-semibold mb-4">Transaction History</h2>
            <Table
              columns={columns}
              data={transactions}
              emptyMessage="No transactions found."
              showPagination
              paginationInfo={{
                total: pagination?.total || transactions.length || 0,
                current: pagination?.currentPage || currentPage,
                pageSize: pagination?.pageSize || limit,
              }}
              onPageChange={handlePageChange}
              enableExport
              exportFileName="transactions"
              onExportRequest={
                userId
                  ? async () => {
                      const res = await dispatch(
                        getTransactionHistory({
                          userId,
                          page: 1,
                          limit: 50000,
                        }),
                      ).unwrap();
                      return res?.data ?? [];
                    }
                  : undefined
              }
            />

            <div className="flex justify-end items-center gap-2 mt-4">
              <Button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Prev
              </Button>
              <Button
                disabled={
                  currentPage >= Math.ceil((pagination?.total || 0) / limit)
                }
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </Card>

          <FundWalletModal
            visible={open}
            onClose={handleOpenModal}
            userId={userId}
            walletId={wallet?.id ?? null}
            onSubmit={handleFundWallet}
          />

          <WithdrawModal
            visible={withdrawModalOpen}
            onClose={handleCloseWithdrawModal}
            userId={userId}
            walletId={wallet?.id ?? null}
            defaultAccountNumber={wallet?.accountNumber ?? ""}
            maxWithdrawableAmount={wallet?.withdrawableBalance ?? 0}
            estateId={ownerEstateId}
            bankCode={wallet?.bankCode ?? ""}
            bankName={
              wallet?.bankCode
                ? residentBanks.find((b) => b.code === wallet.bankCode)?.name ??
                  ""
                : ""
            }
          />

          <TransferToBalanceModal
            visible={transferToBalanceModalOpen}
            onClose={handleCloseTransferToBalanceModal}
            withdrawableBalance={wallet?.withdrawableBalance ?? 0}
            submitting={transferToBalanceLoading}
            onSubmit={handleTransferToMainBalance}
          />

          <CreateWalletModalWrapper
            visible={createWalletModalOpen}
            onClose={() => setCreateWalletModalOpen(false)}
            userId={userId}
            onSuccess={handleCreateWalletSuccess}
          />

          <SetWithdrawalAccountModal
            visible={setWithdrawalAccountModalOpen}
            onClose={handleCloseSetWithdrawalAccountModal}
            onSuccess={handleSetWithdrawalAccountSuccess}
          />
        </div>
      </ResidentVirtualAccountProvider>
    </div>
  );
}
