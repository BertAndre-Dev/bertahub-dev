import { createSlice } from "@reduxjs/toolkit";
import {
  getAdminBillsDashboard,
  getAdminTransactionDashboard,
  getAdminMeterDashboard,
  type AdminBillsAnalyticsData,
  type AdminTransactionAnalyticsData,
  type AdminMeterAnalyticsData,
} from "./admin-dashboard-analytics";

export interface AdminDashboardAnalyticsState {
  bills: AdminBillsAnalyticsData | null;
  transactions: AdminTransactionAnalyticsData | null;
  meter: AdminMeterAnalyticsData | null;
  billsStatus: "idle" | "isLoading" | "succeeded" | "failed";
  transactionsStatus: "idle" | "isLoading" | "succeeded" | "failed";
  meterStatus: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AdminDashboardAnalyticsState = {
  bills: null,
  transactions: null,
  meter: null,
  billsStatus: "idle",
  transactionsStatus: "idle",
  meterStatus: "idle",
  error: null,
};

const adminDashboardAnalyticsSlice = createSlice({
  name: "adminDashboardAnalytics",
  initialState,
  reducers: {
    clearAdminDashboardAnalytics: (state) => {
      state.bills = null;
      state.transactions = null;
      state.meter = null;
      state.billsStatus = "idle";
      state.transactionsStatus = "idle";
      state.meterStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Bills
      .addCase(getAdminBillsDashboard.pending, (state) => {
        state.billsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAdminBillsDashboard.fulfilled, (state, action) => {
        state.billsStatus = "succeeded";
        state.bills = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getAdminBillsDashboard.rejected, (state, action) => {
        state.billsStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch bills analytics";
      })
      // Transactions
      .addCase(getAdminTransactionDashboard.pending, (state) => {
        state.transactionsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAdminTransactionDashboard.fulfilled, (state, action) => {
        state.transactionsStatus = "succeeded";
        state.transactions = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getAdminTransactionDashboard.rejected, (state, action) => {
        state.transactionsStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch transaction analytics";
      })
      // Meter
      .addCase(getAdminMeterDashboard.pending, (state) => {
        state.meterStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAdminMeterDashboard.fulfilled, (state, action) => {
        state.meterStatus = "succeeded";
        state.meter = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getAdminMeterDashboard.rejected, (state, action) => {
        state.meterStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch meter analytics";
      });
  },
});

export const { clearAdminDashboardAnalytics } =
  adminDashboardAnalyticsSlice.actions;
export default adminDashboardAnalyticsSlice.reducer;
