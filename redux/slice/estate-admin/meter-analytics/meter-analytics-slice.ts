import { createSlice } from "@reduxjs/toolkit";
import {
  getMeterAnalyticsDashboard,
  type MeterAnalyticsDashboardData,
} from "./meter-analytics";

export interface MeterAnalyticsState {
  dashboard: MeterAnalyticsDashboardData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: MeterAnalyticsState = {
  dashboard: null,
  status: "idle",
  error: null,
};

const meterAnalyticsSlice = createSlice({
  name: "estateAdminMeterAnalytics",
  initialState,
  reducers: {
    clearMeterAnalytics: (state) => {
      state.dashboard = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMeterAnalyticsDashboard.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getMeterAnalyticsDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.dashboard = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getMeterAnalyticsDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch meter analytics";
      });
  },
});

export const { clearMeterAnalytics } = meterAnalyticsSlice.actions;
export default meterAnalyticsSlice.reducer;
