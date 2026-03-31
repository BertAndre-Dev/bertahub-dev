import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

import {
  fetchFinancialReportAnalyticsChart,
  fetchFinancialReportGenerate,
  type AnalyticsChartPoint,
  type FinancialReportAnalyticsChartResponse,
  type FinancialReportGenerateResponse,
} from "./financial-report";

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface EstateAdminFinancialReportState {
  generateState: AsyncState;
  analyticsState: AsyncState;
  report: FinancialReportGenerateResponse["data"] | null;
  chartData: AnalyticsChartPoint[];
  chartMeta: FinancialReportAnalyticsChartResponse["data"] | null;
  error: string | null;
}

const initialState: EstateAdminFinancialReportState = {
  generateState: "idle",
  analyticsState: "idle",
  report: null,
  chartData: [],
  chartMeta: null,
  error: null,
};

const slice = createSlice({
  name: "estateAdminFinancialReport",
  initialState,
  reducers: {
    resetFinancialReportError: (state) => {
      state.error = null;
    },
    clearFinancialReport: (state) => {
      state.report = null;
      state.chartData = [];
      state.chartMeta = null;
      state.generateState = "idle";
      state.analyticsState = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinancialReportGenerate.pending, (state) => {
        state.generateState = "isLoading";
        state.error = null;
      })
      .addCase(fetchFinancialReportGenerate.fulfilled, (state, action: any) => {
        state.generateState = "succeeded";
        state.report = action.payload?.data ?? null;
      })
      .addCase(fetchFinancialReportGenerate.rejected, (state, action: any) => {
        state.generateState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to generate financial report.";
      });

    builder
      .addCase(fetchFinancialReportAnalyticsChart.pending, (state) => {
        state.analyticsState = "isLoading";
        state.error = null;
      })
      .addCase(fetchFinancialReportAnalyticsChart.fulfilled, (state, action: any) => {
        state.analyticsState = "succeeded";
        const data = action.payload?.data ?? null;
        state.chartMeta = data;
        state.chartData = data?.chartData ?? [];
      })
      .addCase(fetchFinancialReportAnalyticsChart.rejected, (state, action: any) => {
        state.analyticsState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to fetch analytics chart data.";
      });
  },
});

export const { resetFinancialReportError, clearFinancialReport } = slice.actions;
export default slice.reducer;

export const selectEstateAdminFinancialReport = (state: RootState) =>
  (state as any).estateAdminFinancialReport as EstateAdminFinancialReportState;
export const selectFinancialReportData = (state: RootState) =>
  selectEstateAdminFinancialReport(state)?.report ?? null;
export const selectFinancialReportChartData = (state: RootState) =>
  selectEstateAdminFinancialReport(state)?.chartData ?? [];
export const selectFinancialReportLoading = (state: RootState) => {
  const s = selectEstateAdminFinancialReport(state);
  return (
    s?.generateState === "isLoading" || s?.analyticsState === "isLoading"
  );
};
export const selectFinancialReportError = (state: RootState) =>
  selectEstateAdminFinancialReport(state)?.error ?? null;

