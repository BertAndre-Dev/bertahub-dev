import { createSlice } from "@reduxjs/toolkit";
import {
  getBillsAnalyticsDashboard,
  type BillsAnalyticsData,
} from "./bills-analytics";

export interface BillsAnalyticsState {
  dashboard: BillsAnalyticsData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: BillsAnalyticsState = {
  dashboard: null,
  status: "idle",
  error: null,
};

const billsAnalyticsSlice = createSlice({
  name: "estateAdminBillsAnalytics",
  initialState,
  reducers: {
    clearBillsAnalytics: (state) => {
      state.dashboard = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBillsAnalyticsDashboard.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getBillsAnalyticsDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.dashboard = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getBillsAnalyticsDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch bills analytics";
      });
  },
});

export const { clearBillsAnalytics } = billsAnalyticsSlice.actions;
export default billsAnalyticsSlice.reducer;
