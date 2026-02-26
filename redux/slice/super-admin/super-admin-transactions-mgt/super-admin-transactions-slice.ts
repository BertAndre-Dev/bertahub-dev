import { createSlice } from "@reduxjs/toolkit";
import {
  getAllTransactionHistory,
  TransactionData,
  TransactionPagination,
  getTransactionById,
  verifyTransaction,
} from "./super-admin-transactions";
// import { getTransactionById } from "./super-admin-transactions";

export interface SuperAdminTransactionResponse {
  success: boolean;
  message: string;
  data: TransactionData[];
  pagination: TransactionPagination;
}

export interface SuperAdminTransactionState {
  getAllTransactionHistoryState:
    | "idle"
    | "isLoading"
    | "succeeded"
    | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  getTransactionState: "idle" | "isLoading" | "succeeded" | "failed";
  verifyTransactionState: "idle" | "isLoading" | "succeeded" | "failed";
  selectedTransaction: any | null;
  allTransactionHistory: SuperAdminTransactionResponse | null;
  error: string | null;
}

const initialState: SuperAdminTransactionState = {
  getAllTransactionHistoryState: "idle",
  getTransactionState: "idle",
  verifyTransactionState: "idle",
  status: "idle",
  allTransactionHistory: null,
  selectedTransaction: null,
  error: null,
};

const superAdminTransactionSlice = createSlice({
  name: "superAdminTransaction",
  initialState,
  reducers: {
    resetSuperAdminTransactionState: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers(builder) {
    // ✅ GET ALL TRANSACTION HISTORY
    builder
      .addCase(getAllTransactionHistory.pending, (state) => {
        state.getAllTransactionHistoryState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(getAllTransactionHistory.fulfilled, (state, action) => {
        state.getAllTransactionHistoryState = "succeeded";
        state.status = "succeeded";

        const pagination = action.payload?.pagination;
        state.allTransactionHistory = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ||
            "All transactions retrieved successfully.",
          data: action.payload?.data || [],
          pagination: {
            total: pagination?.total ?? 0,
            page: Number(pagination?.page) || 1,
            limit: Number(pagination?.limit) || 10,
            pages: Number(pagination?.pages) || 1,
          },
        };
      })

      .addCase(getAllTransactionHistory.rejected, (state, action) => {
        state.getAllTransactionHistoryState = "failed";
        state.status = "failed";
        state.error =
          action.error.message || "Failed to fetch transactions";
      });

    // GET SINGLE TRANSACTION
    builder
      .addCase(getTransactionById.pending, (state) => {
        state.getTransactionState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(getTransactionById.fulfilled, (state, action) => {
        state.getTransactionState = "succeeded";
        state.status = "succeeded";
        state.selectedTransaction = action.payload?.data || null;
      })
      .addCase(getTransactionById.rejected, (state, action) => {
        state.getTransactionState = "failed";
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch transaction";
      });

    // VERIFY TRANSACTION
    builder
      .addCase(verifyTransaction.pending, (state) => {
        state.verifyTransactionState = "isLoading";
      })
      .addCase(verifyTransaction.fulfilled, (state, action) => {
        state.verifyTransactionState = "succeeded";
        const updated = action.payload?.data;
        if (updated && state.selectedTransaction) {
          state.selectedTransaction = { ...state.selectedTransaction, ...updated };
        }
      })
      .addCase(verifyTransaction.rejected, (state, action) => {
        state.verifyTransactionState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to verify transaction";
      });
  },
});

export const { resetSuperAdminTransactionState } =
  superAdminTransactionSlice.actions;
export default superAdminTransactionSlice.reducer;
