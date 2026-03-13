"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FundWalletModal from "@/components/resident/transaction/fund-wallet-modal/page";
import WithdrawModal from "@/components/resident/transaction/withdraw-modal/page";
import TransferToBalanceModal from "@/components/resident/transaction/transfer-to-balance-modal/page";
import CreateWalletModalWrapper from "@/components/resident/transaction/create-wallet-modal-wrapper/page";

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
  generateTxRef,
  transferFundsResident,
  requestResidentOwnerWithdrawalOtp,
} from "@/redux/slice/resident/transaction/transaction";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { getBanks as getResidentBanks } from "@/redux/slice/resident/payment-mgt/payment-mgt";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Table from "@/components/tables/list/page";
import type { WalletData } from "@/redux/slice/resident/wallet-mgt/wallet-mgt-slice";

interface TransactionData {
  walletId: string;
  type: string;
  amount: number;
  description: string;
  userId: string;
  id?: string;
  paymentStatus?: string;
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
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [residentType, setResidentType] = useState<string | null>(null);
  const [transId, setTransId] = useState<string>("");
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
  const createWalletState = useSelector(
    (state: RootState) => state.wallet.createWalletState,
  );
  const residentBanks = useSelector(
    (state: RootState) => state.residentPaymentMgt.banks,
  );
  const loading =
    useSelector(
      (state: RootState) =>
        state.residentTransaction.getTransactionHistoryState,
    ) === "isLoading";

  // 🔹 Fetch signed-in user and wallet on mount
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const id = userRes?.data?.id;
        const userEmail = userRes?.data?.email;
        const rType = userRes?.data?.residentType ?? userRes?.data?.resident_type ?? null;
        const estateId = userRes?.data?.estateId ?? userRes?.data?.estate_id ?? null;

        if (!id) {
          toast.warning("No user found.");
          return;
        }

        setUserId(id);
        setEmail(userEmail || "");
        setResidentType(rType ?? null);
        setOwnerEstateId(estateId ?? null);

        // ✅ Fetch transactions (paginated)
        await dispatch(getTransactionHistory({ userId: id, page: 1, limit }));

        // ✅ Fetch wallet
        const walletRes = await dispatch(getWallet(id)).unwrap();
        if (!walletRes?.data?.id)
          toast.warning("No wallet found for this user.");

        // Load banks for displaying bank name in withdraw modal
        await dispatch(getResidentBanks("NG")).unwrap();
      } catch (err) {
        console.error("❌ Initialization error:", err);
        toast.error("Failed to load data.");
      }
    })();
  }, [dispatch]);

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
      const msg = (error as { message?: string })?.message || "Failed to create wallet.";
      toast.error(msg);
    }
  };
  const handleCreateWalletSuccess = () => {
    if (userId) dispatch(getWallet(userId));
  };

  const handleOpenModal = () => setOpen((prev) => !prev);
  const handleOpenWithdrawModal = () => setWithdrawModalOpen(true);
  const handleCloseWithdrawModal = () => setWithdrawModalOpen(false);
  const handleOpenTransferToBalanceModal = () =>
    setTransferToBalanceModalOpen(true);
  const handleCloseTransferToBalanceModal = () => {
    setTransferToBalanceModalOpen(false);
    setTransferToBalanceLoading(false);
  };

  // Withdraw (owner only) now handled via OTP flow inside WithdrawFundForm (createTransaction + request OTP + withdraw)

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
    } catch (err: any) {
      toast.error(
        err?.message ??
          err?.payload?.message ??
          "Failed to transfer funds to main balance.",
      );
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
      const paymentRes = await dispatch(
        initializePayment({
          tx_ref,
          amount,
          country: "NG",
          currency: "NGN",
          redirect_url: `${window.location.origin}/dashboard/resident/transaction`,
          payment_options: "card",
          customer: { email },
          customizations: {
            title: "Wallet Funding",
            description: item.description || "Continue payment",
          },
        }),
      ).unwrap();

      const paymentUrl = paymentRes?.data?.link || paymentRes?.data?.url;
      if (!paymentUrl) throw new Error("Payment URL not received");
      window.location.href = paymentUrl;
    } catch (err: any) {
      toast.error(err?.message || "Failed to continue payment.");
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
  }: {
    userId: string;
    walletId: string;
    amount: number;
    description: string;
    type: "credit";
    currency: string;
    paymentOption: string;
    country: string;
  }) => {
    try {
      // // ⚠️ Check if amount exceeds the maximum limit BEFORE any transaction
      // const MAX_AMOUNT = 200_000;
      // if (amount > MAX_AMOUNT) {
      //   toast.error(`You cannot fund more than ${MAX_AMOUNT.toLocaleString()}`);
      //   return; // Stop further execution
      // }

      // ✅ Only now we create a transaction
      const txRes = await dispatch(
        createTransaction({ userId, walletId, amount, description, type }),
      ).unwrap();

      const tx_ref = txRes?.data?.tx_ref;
      if (!tx_ref) throw new Error("Transaction reference not found");

      // Initialize payment on Flutterwave
      const paymentRes = await dispatch(
        initializePayment({
          tx_ref,
          amount,
          country,
          currency,
          redirect_url: `${window.location.origin}/dashboard/resident/transaction`,
          payment_options: paymentOption,
          customer: { email },
          customizations: { title: "Wallet Funding", description },
        }),
      ).unwrap();

      const paymentUrl = paymentRes?.data?.link || paymentRes?.data?.url;
      if (!paymentUrl) throw new Error("Payment URL not received");

      // Redirect to Flutterwave
      window.location.href = paymentUrl;
    } catch (err: any) {
      console.error("❌ Fund wallet error:", err);
      toast.error(err?.message || "Failed to fund wallet.");
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

        console.log("🧾 Auto-verifying transaction:", tx_ref);

        // ✅ Trigger verification via Redux thunk
        const verificationRes = await dispatch(
          verifyTransaction({ tx_ref, paymentType: "fundWallet" }),
        ).unwrap();

        console.log("✅ Verification response:", verificationRes);
        toast.success("Wallet funded successfully!");

        // Refresh wallet balance
        await dispatch(getWallet(currentUserId));

        // Clean up URL params
        const url = new URL(window.location.href);
        ["tx_ref", "trx_ref", "transaction_id", "status"].forEach((key) =>
          url.searchParams.delete(key),
        );
        window.history.replaceState({}, document.title, url.toString());
      } catch (err: any) {
        console.error("❌ Verification failed:", err);
        const errorMessage =
          err?.message || err?.payload?.message || "Verification failed";
        toast.error(errorMessage);
      }
    };

    // Small delay helps ensure wallet/user state is loaded
    const timer = setTimeout(verifyTransactionAsync, 800);
    return () => clearTimeout(timer);
  }, [dispatch, userId, email]);

  // Table columns for transaction history
  const columns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
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
      key: "amount",
      header: "Amount (₦)",
      render: (item: any) => item.amount?.toLocaleString() ?? 0,
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (item: any) =>
        item.paymentStatus === "successful" ? (
          <span className="text-green-600 font-medium">Successful</span>
        ) : (
          <span className="text-yellow-600 font-medium">
            {item.paymentStatus || "Pending"}
          </span>
        ),
    },
    {
      key: "actions",
      header: "Action",
      render: (item: any) =>
        item.paymentStatus === "not-paid" ? (
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
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-6 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">My Wallet</CardTitle>
        </CardHeader>

        <CardContent>
          {wallet ? (
            <div className="space-y-4">
              {/* Owner: show available + withdrawable like estate admin */}
              {isOwner ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col justify-center items-center w-full min-h-[120px] border border-[#CCCCCC] rounded-lg p-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Total Wallet Balance
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs cursor-help"
                        title="You can only withdraw from this balance."
                      >
                        i
                      </span>
                    </p>
                    <p className="text-2xl md:text-3xl font-bold mt-1 text-primary">
                      {formatNaira(wallet?.balance ?? 0)}
                    </p>
                  </div>
                  <div className="flex flex-col justify-center items-center w-full min-h-[120px] border border-[#CCCCCC] rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Available Wallet Balance
                    </p>
                    <p className="text-2xl md:text-3xl font-bold mt-1">
                      {formatNaira(wallet?.availableBalance ?? wallet?.balance ?? 0)}
                    </p>
                  </div>
                  <div className="flex flex-col justify-center items-center w-full min-h-[120px] border border-[#CCCCCC] rounded-lg p-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Withdrawable Wallet Balance
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs cursor-help"
                        title="You can only withdraw from this balance."
                      >
                        i
                      </span>
                    </p>
                    <p className="text-2xl md:text-3xl font-bold mt-1 text-primary">
                      {formatNaira(wallet?.withdrawableBalance ?? 0)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-5 md:gap-0 items-start md:items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet Balance</p>
                    <p className="text-4xl font-bold mt-1">
                      {formatNaira(wallet?.balance ?? 0)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <Button onClick={handleOpenModal} size="lg" className="px-6 w-full md:w-1/3">
                  Fund Wallet
                </Button>
                {isOwner && (
                  <>
                    <Button
                      onClick={handleOpenWithdrawModal}
                      size="lg"
                      variant="outline"
                      className="px-6 w-full md:w-1/3"
                    >
                      Withdraw
                    </Button>
                    <Button
                      onClick={handleOpenTransferToBalanceModal}
                      size="lg"
                      variant="secondary"
                      className="px-6 w-full md:w-1/3"
                      title={
                        (wallet?.withdrawableBalance ?? 0) <= 0
                          ? "No withdrawable balance to transfer"
                          : "Move withdrawable balance to your main balance"
                      }
                    >
                      Transfer to Balance
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Button
              onClick={handleCreateWalletClick}
              disabled={
                createWalletState === "isLoading" ||
                (isOwner && createWalletModalOpen)
              }
            >
              {createWalletState === "isLoading"
                ? "Creating wallet..."
                : "Create Wallet"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="p-4">
        <h2 className="font-semibold mb-4">Transaction History</h2>
        <Table
          columns={columns}
          data={transactions}
          emptyMessage={
            loading ? "Loading transactions..." : "No transactions found."
          }
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
                    getTransactionHistory({ userId, page: 1, limit: 50000 }),
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
            ? residentBanks.find((b) => b.code === wallet.bankCode)?.name ?? ""
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
    </div>
  );
}
