import { createSlice } from "@reduxjs/toolkit";
import {
    createTransaction,
    getTransaction,
    getTransactionHistory,
    getEstateTransactionHistory,
    verifyTransaction,
    // initializePayment,
    transferFunds
} from './transaction';

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

export interface Pagination {
    total: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
}

export interface TransactionResponse {
    success: boolean;
    message: string;
    data: TransactionData[];
    pagination: Pagination;
}

// ✅ Payment Response Interface
export interface PaymentResponse {
    status: string;
    message: string;
    data?: any;
}

export interface TransactionState {
    createTransactionState: "idle" | "isLoading" | "succeeded" | "failed";
    getTransactionState: "idle" | "isLoading" | "succeeded" | "failed";
    getTransactionHistoryState: "idle" | "isLoading" | "succeeded" | "failed";
    getEstateTransactionHistoryState: "idle" | "isLoading" | "succeeded" | "failed";
    verifyTransactionState: "idle" | "isLoading" | "succeeded" | "failed";
    initializePaymentState: "idle" | "isLoading" | "succeeded" | "failed";
    transferFundsState: "idle" | "isLoading" | "succeeded" | "failed";
    status: "idle" | "isLoading" | "succeeded" | "failed";
    transaction: TransactionData | null;
    allTransactions: TransactionResponse | null;
    paymentData: PaymentResponse | null;
    error: string | null;
}

const initialState: TransactionState = {
    createTransactionState: "idle",
    getTransactionState: "idle",
    getTransactionHistoryState: "idle",
    getEstateTransactionHistoryState: "idle",
    verifyTransactionState: "idle",
    initializePaymentState: "idle",
    transferFundsState: "idle",
    status: "idle",
    transaction: null,
    allTransactions: null,
    paymentData: null,
    error: null
};

const transactionSlice = createSlice({
    name: 'estateAdminTransaction',
    initialState,
    reducers: {
        resetTransactionState: (state) => {
            state.status = 'idle';
            state.error = null;
            state.paymentData = null;
        },
    },
    extraReducers(builder) {
        // ✅ CREATE TRANSACTION
        builder
            .addCase(createTransaction.pending, (state) => {
                state.createTransactionState = "isLoading";
            })
            .addCase(createTransaction.fulfilled, (state, action) => {
                state.createTransactionState = "succeeded";
                const newTras = action.payload?.data;
                if (newTras) {
                    if (state.allTransactions?.data) {
                        state.allTransactions.data.push(newTras);
                        state.allTransactions.pagination.total += 1;
                    } else {
                        state.allTransactions = {
                            success: true,
                            message: "Transaction created successfully",
                            data: [newTras],
                            pagination: {
                                total: 1,
                                currentPage: 1,
                                totalPages: 1,
                                pageSize: 10,
                            },
                        };
                    }
                }
            })
            .addCase(createTransaction.rejected, (state, action) => {
                state.createTransactionState = "failed";
                state.error =
                    action.error.message || "Failed to create transaction";
            });

        // ✅ GET SINGLE TRANSACTION
        builder
            .addCase(getTransaction.pending, (state) => {
                state.getTransactionState = "isLoading";
            })
            .addCase(getTransaction.fulfilled, (state, action) => {
                state.getTransactionState = "succeeded";
                state.transaction = action.payload?.data || null;
            })
            .addCase(getTransaction.rejected, (state, action) => {
                state.getTransactionState = "failed";
                state.error = action.error.message || "Failed to fetch transaction";
            });

        // ✅ GET TRANSACTION HISTORY
        builder
            .addCase(getTransactionHistory.pending, (state) => {
                state.getTransactionHistoryState = "isLoading";
                state.status = "isLoading";
            })
            .addCase(getTransactionHistory.fulfilled, (state, action) => {
                state.getTransactionHistoryState = "succeeded";
                state.status = "succeeded";
                state.allTransactions = {
                    success: action.payload?.success ?? true,
                    message:
                        action.payload?.message ?? "Transactions retrieved successfully.",
                    data: action.payload?.data || [],
                    pagination: action.payload?.pagination || {
                        total: action.payload?.data?.length ?? 0,
                        currentPage: 1,
                        totalPages: 1,
                        pageSize: 10,
                    },
                };
            })
            .addCase(getTransactionHistory.rejected, (state, action) => {
                state.getTransactionHistoryState = "failed";
                state.status = "failed";
                state.error = action.error.message || "Failed to fetch transactions";
            });

        // ✅ GET ESTATE TRANSACTION HISTORY
        builder
            .addCase(getEstateTransactionHistory.pending, (state) => {
                state.getEstateTransactionHistoryState = "isLoading";
                state.status = "isLoading";
            })
            .addCase(getEstateTransactionHistory.fulfilled, (state, action) => {
                state.getEstateTransactionHistoryState = "succeeded";
                state.status = "succeeded";
                const apiPagination = action.payload?.pagination || {};
                // Map API pagination structure (page, pages, limit) to our internal structure (currentPage, totalPages, pageSize)
                state.allTransactions = {
                    success: action.payload?.success ?? true,
                    message:
                        action.payload?.message ?? "Estate transactions retrieved successfully.",
                    data: action.payload?.data || [],
                    pagination: {
                        total: apiPagination.total ?? 0,
                        currentPage: apiPagination.page ?? 1,
                        totalPages: apiPagination.pages ?? 1,
                        pageSize: apiPagination.limit ?? 10,
                    },
                };
            })
            .addCase(getEstateTransactionHistory.rejected, (state, action) => {
                state.getEstateTransactionHistoryState = "failed";
                state.status = "failed";
                state.error = action.error.message || "Failed to fetch estate transactions";
            });

        // ✅ VERIFY TRANSACTION
        builder
            .addCase(verifyTransaction.pending, (state) => {
                state.verifyTransactionState = "isLoading";
            })
            .addCase(verifyTransaction.fulfilled, (state, action) => {
                state.verifyTransactionState = "succeeded";
                state.transaction = action.payload?.data || null;
            })
            .addCase(verifyTransaction.rejected, (state, action) => {
                state.verifyTransactionState = "failed";
                state.error =
                    (action.payload as { message: string })?.message ||
                    action.error.message ||
                    "Failed to verify transaction";
            });

        // ✅ INITIALIZE PAYMENT (commented out - not currently used)
        // builder
        //     .addCase(initializePayment.pending, (state) => {
        //         state.initializePaymentState = "isLoading";
        //         state.error = null;
        //     })
        //     .addCase(initializePayment.fulfilled, (state, action) => {
        //         state.initializePaymentState = "succeeded";
        //         state.paymentData = action.payload;
        //     })
        //     .addCase(initializePayment.rejected, (state, action) => {
        //         state.initializePaymentState = "failed";
        //         state.error =
        //             (action.payload as { message: string })?.message ||
        //             action.error.message ||
        //             "Failed to initialize payment";
        //     });

        // ✅ TRANSFER FUNDS
        builder
            .addCase(transferFunds.pending, (state) => {
                state.transferFundsState = "isLoading";
                state.error = null;
            })
            .addCase(transferFunds.fulfilled, (state, action) => {
                state.transferFundsState = "succeeded";
                state.paymentData = action.payload;
            })
            .addCase(transferFunds.rejected, (state, action) => {
                state.transferFundsState = "failed";
                state.error =
                    (action.payload as { message: string })?.message ||
                    action.error.message ||
                    "Failed to transfer funds";
            });
    },
});

export const { resetTransactionState } = transactionSlice.actions;
export default transactionSlice.reducer;
