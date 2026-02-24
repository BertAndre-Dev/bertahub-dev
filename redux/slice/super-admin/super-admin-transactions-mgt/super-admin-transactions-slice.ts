import { createSlice } from "@reduxjs/toolkit";
import {
  getAllTransactionHistory,
  TransactionData,
  TransactionPagination,
} from "./super-admin-transactions";

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
  allTransactionHistory: SuperAdminTransactionResponse | null;
  error: string | null;
}

const initialState: SuperAdminTransactionState = {
  getAllTransactionHistoryState: "idle",
  status: "idle",
  allTransactionHistory: null,
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
  },
});

export const { resetSuperAdminTransactionState } =
  superAdminTransactionSlice.actions;
export default superAdminTransactionSlice.reducer;
