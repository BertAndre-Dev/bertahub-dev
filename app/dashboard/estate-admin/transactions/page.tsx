"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import WithdrawFundForm from "@/components/estate-admin/transactions/fund-wallet-form/page";

import {
    createWallet,
    getWallet,
} from "@/redux/slice/resident/wallet-mgt/wallet-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
    createTransaction,
    verifyTransaction,
    getTransactionHistory,
    getEstateTransactionHistory,
    transferFunds
} from "@/redux/slice/estate-admin/transaction/transaction";

import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Table from "@/components/tables/list/page";


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

export default function TransactionPage() {
    const dispatch = useDispatch<AppDispatch>();
    const [open, setOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [estateId, setEstateId] = useState<string | null>(null);
    const [email, setEmail] = useState<string>("");
    const [transId, setTransId] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const transactions = useSelector(
        (state: RootState) => state.estateAdminTransaction.allTransactions?.data || []
    );
    const pagination = useSelector(
        (state: RootState) => state.estateAdminTransaction.allTransactions?.pagination
    );
    const wallet = useSelector((state: RootState) => state.wallet.wallet);
    const createWalletState = useSelector(
        (state: RootState) => state.wallet.createWalletState
    );
    const loading =
        useSelector(
            (state: RootState) => state.estateAdminTransaction.getEstateTransactionHistoryState
        ) === "isLoading";


    // 🔹 Fetch signed-in user and wallet on mount
    useEffect(() => {
        (async () => {
            try {
                const userRes = await dispatch(getSignedInUser()).unwrap();
                const id = userRes?.data?.id;
                const userEmail = userRes?.data?.email;
                const estateIdFromUser =
                    userRes?.data?.estateId || userRes?.data?.estate?.id;

                if (!id) {
                    toast.warning("No user found.");
                    return;
                }

                setUserId(id);
                setEmail(userEmail || "");
                if (estateIdFromUser) setEstateId(estateIdFromUser);

                // ✅ Fetch estate transactions (paginated) using estateId
                if (estateIdFromUser) {
                    await dispatch(getEstateTransactionHistory({ estateId: estateIdFromUser, page: 1, limit }));
                }

                // ✅ Fetch wallet
                const walletRes = await dispatch(getWallet(id)).unwrap();
                if (!walletRes?.data?.id) toast.warning("No wallet found for this user.");
            } catch (err) {
                console.error("❌ Initialization error:", err);
                toast.error("Failed to load data.");
            }
        })();
    }, [dispatch]);

    // 🔹 Pagination Handler
    const handlePageChange = async (newPage: number) => {
        if (!estateId) return;
        setCurrentPage(newPage);
        await dispatch(getEstateTransactionHistory({ estateId, page: newPage, limit }));
    };


    // 🔹 Create Wallet
    const handleCreateWallet = async () => {
        if (!userId) {
            toast.warning("No user found.");
            return;
        }
        if (!estateId) {
            toast.warning("No estate found for this user.");
            return;
        }
        try {
            await dispatch(
                createWallet({ userId, estateId, balance: 0, lockedBalance: 0 })
            ).unwrap();
            toast.success("Wallet created successfully.");
            dispatch(getWallet(userId));
        } catch (error: any) {
            toast.error(error?.message || "Failed to create wallet.");
        }
    };

    const handleOpenModal = () => setOpen((prev) => !prev);

    // 🔹 Withdraw Fund Handler
    const handleSumbit = async ({
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
                toast.error("Bank code and account number are required for withdrawal.");
                return;
            }

            // Generate a unique reference for the transfer
            const reference = `withdraw_${userId}_${Date.now()}`;

            // Create transaction record first
            const txRes = await dispatch(
                createTransaction({ userId, walletId, amount, description, type })
            ).unwrap();

            const tx_ref = txRes?.data?.tx_ref || reference;

            // Transfer funds to bank account
            await dispatch(
                transferFunds({
                    amount,
                    currency,
                    narration: description || `Withdrawal of ${currency} ${amount}`,
                    bankCode,
                    accountNumber,
                    reference: tx_ref,
                })
            ).unwrap();

            toast.success("Fund withdrawal initiated successfully!");

            // Refresh wallet balance and transactions
            await dispatch(getWallet(userId));
            if (estateId) {
                await dispatch(getEstateTransactionHistory({ estateId, page: currentPage, limit }));
            }

            // Close modal
            setOpen(false);
        } catch (err: any) {
            console.error("❌ Withdraw fund error:", err);
            const errorMessage = err?.message || err?.payload?.message || "Failed to withdraw fund.";
            toast.error(errorMessage);
            throw err; // Re-throw to let form handle it
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
                    verifyTransaction({ tx_ref, paymentType: "withdrawFund" })
                ).unwrap();

                console.log("✅ Verification response:", verificationRes);
                toast.success("Withdrawal successfull!");

                // Refresh wallet balance
                await dispatch(getWallet(currentUserId));

                // Clean up URL params
                const url = new URL(window.location.href);
                ["tx_ref", "trx_ref", "transaction_id", "status"].forEach((key) =>
                    url.searchParams.delete(key)
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


    // Table columns for paid bills
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
    ];


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

            {/* Transactions Table */}
            <Card className="p-4">
                <h2 className="font-semibold mb-4">Transaction History</h2>
                <Table
                    columns={columns}
                    data={transactions}
                    emptyMessage={loading ? "Loading transactions..." : "No transactions found."}
                    showPagination
                    paginationInfo={{
                        total: pagination?.total || transactions.length || 0,
                        current: pagination?.currentPage || currentPage,
                        pageSize: pagination?.pageSize || limit,
                    }}
                    onPageChange={handlePageChange}
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
                            currentPage >= (pagination?.totalPages || 1)
                        }
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        Next
                    </Button>
                </div>
            </Card>

            <Modal visible={open} onClose={handleOpenModal}>
                <div className=" bg-white rounded-md shadow-md w-full max-w-md mx-auto">
                    {userId && wallet ? (
                        <WithdrawFundForm
                            userId={userId}
                            walletId={wallet.id ?? ""}
                            onSubmit={handleSumbit}

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