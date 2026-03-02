import { createSlice } from "@reduxjs/toolkit";
import {
  getTransactionAnalyticsDashboard,
  type TransactionAnalyticsData,
} from "./transaction-analytics";

export interface TransactionAnalyticsState {
  dashboard: TransactionAnalyticsData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: TransactionAnalyticsState = {
  dashboard: null,
  status: "idle",
  error: null,
};

const transactionAnalyticsSlice = createSlice({
  name: "estateAdminTransactionAnalytics",
  initialState,
  reducers: {
    clearTransactionAnalytics: (state) => {
      state.dashboard = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTransactionAnalyticsDashboard.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getTransactionAnalyticsDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.dashboard = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getTransactionAnalyticsDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch transaction analytics";
      });
  },
});

export const { clearTransactionAnalytics } = transactionAnalyticsSlice.actions;
export default transactionAnalyticsSlice.reducer;
