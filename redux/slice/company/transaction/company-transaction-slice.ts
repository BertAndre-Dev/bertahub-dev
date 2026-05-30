import { createSlice } from "@reduxjs/toolkit";
import {
  getCompanyTransactionHistory,
  getCompanyVends,
  getCompanyPaidBills,
  verifyCompanyTransaction,
} from "./company-transaction";

interface TransactionData {
  walletId?: string;
  type: string;
  amount: number;
  description?: string;
  userId?: string;
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

export interface CompanyTransactionState {
  getCompanyTransactionHistoryState:
    | "idle"
    | "isLoading"
    | "succeeded"
    | "failed";
  getCompanyVendsState: "idle" | "isLoading" | "succeeded" | "failed";
  getCompanyPaidBillsState: "idle" | "isLoading" | "succeeded" | "failed";
  verifyTransactionState: "idle" | "isLoading" | "succeeded" | "failed";
  allTransactions: TransactionResponse | null;
  vends: { data: unknown[]; pagination: Record<string, number> | null } | null;
  paidBills: { data: unknown[]; pagination: Record<string, number> | null } | null;
  error: string | null;
}

const initialState: CompanyTransactionState = {
  getCompanyTransactionHistoryState: "idle",
  getCompanyVendsState: "idle",
  getCompanyPaidBillsState: "idle",
  verifyTransactionState: "idle",
  allTransactions: null,
  vends: null,
  paidBills: null,
  error: null,
};

const companyTransactionSlice = createSlice({
  name: "companyTransaction",
  initialState,
  reducers: {
    resetCompanyTransactionState: (state) => {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getCompanyTransactionHistory.pending, (state) => {
        state.getCompanyTransactionHistoryState = "isLoading";
      })
      .addCase(getCompanyTransactionHistory.fulfilled, (state, action) => {
        state.getCompanyTransactionHistoryState = "succeeded";
        const apiPagination = action.payload?.pagination || {};
        state.allTransactions = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ??
            "Company transactions retrieved successfully.",
          data: action.payload?.data || [],
          pagination: {
            total: apiPagination.total ?? 0,
            currentPage: apiPagination.page ?? 1,
            totalPages: apiPagination.pages ?? 1,
            pageSize: apiPagination.limit ?? 10,
          },
        };
      })
      .addCase(getCompanyTransactionHistory.rejected, (state, action) => {
        state.getCompanyTransactionHistoryState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          null;
      })

      .addCase(getCompanyVends.pending, (state) => {
        state.getCompanyVendsState = "isLoading";
      })
      .addCase(getCompanyVends.fulfilled, (state, action) => {
        state.getCompanyVendsState = "succeeded";
        state.vends = {
          data: action.payload?.data ?? [],
          pagination: action.payload?.pagination ?? null,
        };
      })
      .addCase(getCompanyVends.rejected, (state, action) => {
        state.getCompanyVendsState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          null;
      })

      .addCase(getCompanyPaidBills.pending, (state) => {
        state.getCompanyPaidBillsState = "isLoading";
      })
      .addCase(getCompanyPaidBills.fulfilled, (state, action) => {
        state.getCompanyPaidBillsState = "succeeded";
        state.paidBills = {
          data: action.payload?.data ?? [],
          pagination: action.payload?.pagination ?? null,
        };
      })
      .addCase(getCompanyPaidBills.rejected, (state, action) => {
        state.getCompanyPaidBillsState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          null;
      })

      .addCase(verifyCompanyTransaction.pending, (state) => {
        state.verifyTransactionState = "isLoading";
      })
      .addCase(verifyCompanyTransaction.fulfilled, (state) => {
        state.verifyTransactionState = "succeeded";
      })
      .addCase(verifyCompanyTransaction.rejected, (state, action) => {
        state.verifyTransactionState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          null;
      });
  },
});

export const { resetCompanyTransactionState } = companyTransactionSlice.actions;
export default companyTransactionSlice.reducer;

export const selectCompanyTransactions = (state: {
  companyTransaction: CompanyTransactionState;
}) => state.companyTransaction.allTransactions?.data ?? [];

export const selectCompanyTransactionsPagination = (state: {
  companyTransaction: CompanyTransactionState;
}) => state.companyTransaction.allTransactions?.pagination ?? null;

export const selectCompanyTransactionsLoading = (state: {
  companyTransaction: CompanyTransactionState;
}) =>
  state.companyTransaction.getCompanyTransactionHistoryState === "isLoading";
