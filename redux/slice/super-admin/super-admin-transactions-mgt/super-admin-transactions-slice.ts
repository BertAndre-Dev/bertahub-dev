import { createSlice } from "@reduxjs/toolkit";
import {
  getAllTransactionHistory,
  TransactionData,
  TransactionPagination,
  getTransactionById
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
  selectedTransaction: any | null;
  allTransactionHistory: SuperAdminTransactionResponse | null;
  error: string | null;
}

const initialState: SuperAdminTransactionState = {
  getAllTransactionHistoryState: "idle",
  getTransactionState: "idle",
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
  },
});

export const { resetSuperAdminTransactionState } =
  superAdminTransactionSlice.actions;
export default superAdminTransactionSlice.reducer;
