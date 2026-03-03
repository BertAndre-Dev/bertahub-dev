import { createSlice } from "@reduxjs/toolkit";
import {
  getResidentDashboardBills,
  getResidentDashboardTransactions,
  getResidentDashboardVendHistory,
  type ResidentBillItem,
  type ResidentTransactionItem,
  type ResidentVendItem,
} from "./resident-dashboard-analytics";

export interface ResidentDashboardAnalyticsState {
  bills: ResidentBillItem[];
  transactions: ResidentTransactionItem[];
  vending: ResidentVendItem[];
  billsStatus: "idle" | "isLoading" | "succeeded" | "failed";
  transactionsStatus: "idle" | "isLoading" | "succeeded" | "failed";
  vendingStatus: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ResidentDashboardAnalyticsState = {
  bills: [],
  transactions: [],
  vending: [],
  billsStatus: "idle",
  transactionsStatus: "idle",
  vendingStatus: "idle",
  error: null,
};

const residentDashboardAnalyticsSlice = createSlice({
  name: "residentDashboardAnalytics",
  initialState,
  reducers: {
    clearResidentDashboardAnalytics: (state) => {
      state.bills = [];
      state.transactions = [];
      state.vending = [];
      state.billsStatus = "idle";
      state.transactionsStatus = "idle";
      state.vendingStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getResidentDashboardBills.pending, (state) => {
        state.billsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getResidentDashboardBills.fulfilled, (state, action) => {
        state.billsStatus = "succeeded";
        state.bills = action.payload?.list ?? [];
        state.error = null;
      })
      .addCase(getResidentDashboardBills.rejected, (state, action) => {
        state.billsStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch bills";
      })
      .addCase(getResidentDashboardTransactions.pending, (state) => {
        state.transactionsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getResidentDashboardTransactions.fulfilled, (state, action) => {
        state.transactionsStatus = "succeeded";
        state.transactions = action.payload?.list ?? [];
        state.error = null;
      })
      .addCase(getResidentDashboardTransactions.rejected, (state, action) => {
        state.transactionsStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch transactions";
      })
      .addCase(getResidentDashboardVendHistory.pending, (state) => {
        state.vendingStatus = "isLoading";
        state.error = null;
      })
      .addCase(getResidentDashboardVendHistory.fulfilled, (state, action) => {
        state.vendingStatus = "succeeded";
        state.vending = action.payload?.list ?? [];
        state.error = null;
      })
      .addCase(getResidentDashboardVendHistory.rejected, (state, action) => {
        state.vendingStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch vend history";
      });
  },
});

export const { clearResidentDashboardAnalytics } =
  residentDashboardAnalyticsSlice.actions;
export default residentDashboardAnalyticsSlice.reducer;
