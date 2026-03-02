import { createSlice } from "@reduxjs/toolkit";
import {
  getSuperAdminBillsAnalyticsDashboard,
  type SuperAdminBillsAnalyticsData,
} from "./super-admin-bills-analytics";

export interface SuperAdminBillsAnalyticsState {
  dashboard: SuperAdminBillsAnalyticsData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: SuperAdminBillsAnalyticsState = {
  dashboard: null,
  status: "idle",
  error: null,
};

const superAdminBillsAnalyticsSlice = createSlice({
  name: "superAdminBillsAnalytics",
  initialState,
  reducers: {
    clearSuperAdminBillsAnalytics: (state) => {
      state.dashboard = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSuperAdminBillsAnalyticsDashboard.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getSuperAdminBillsAnalyticsDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.dashboard = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getSuperAdminBillsAnalyticsDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch bills analytics";
      });
  },
});

export const { clearSuperAdminBillsAnalytics } = superAdminBillsAnalyticsSlice.actions;
export default superAdminBillsAnalyticsSlice.reducer;
