import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

import {
  fetchCompanyFinancialReportAnalyticsChart,
  fetchCompanyFinancialReportGenerate,
  type CompanyAnalyticsChartPoint,
  type CompanyFinancialReportAnalyticsChartResponse,
  type CompanyFinancialReportGenerateResponse,
} from "./company-financial-report";

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyFinancialReportState {
  generateState: AsyncState;
  analyticsState: AsyncState;
  selectedEstateId: string | null;
  report: CompanyFinancialReportGenerateResponse["data"] | null;
  chartData: CompanyAnalyticsChartPoint[];
  chartMeta: CompanyFinancialReportAnalyticsChartResponse["data"] | null;
  error: string | null;
}

const initialState: CompanyFinancialReportState = {
  generateState: "idle",
  analyticsState: "idle",
  selectedEstateId: null,
  report: null,
  chartData: [],
  chartMeta: null,
  error: null,
};

const companyFinancialReportSlice = createSlice({
  name: "companyFinancialReport",
  initialState,
  reducers: {
    resetCompanyFinancialReportError: (state) => {
      state.error = null;
    },
    clearCompanyFinancialReport: (state) => {
      state.report = null;
      state.chartData = [];
      state.chartMeta = null;
      state.generateState = "idle";
      state.analyticsState = "idle";
      state.error = null;
    },
    setCompanyFinancialReportEstate: (state, action) => {
      state.selectedEstateId = action.payload;
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
      .addCase(fetchCompanyFinancialReportGenerate.pending, (state) => {
        state.generateState = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyFinancialReportGenerate.fulfilled, (state, action) => {
        state.generateState = "succeeded";
        state.report = action.payload?.data ?? null;
      })
      .addCase(fetchCompanyFinancialReportGenerate.rejected, (state, action) => {
        state.generateState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to generate financial report.";
      });

    builder
      .addCase(fetchCompanyFinancialReportAnalyticsChart.pending, (state) => {
        state.analyticsState = "isLoading";
        state.error = null;
      })
      .addCase(
        fetchCompanyFinancialReportAnalyticsChart.fulfilled,
        (state, action) => {
          state.analyticsState = "succeeded";
          const data = action.payload?.data ?? null;
          state.chartMeta = data;
          state.chartData = data?.chartData ?? [];
        },
      )
      .addCase(
        fetchCompanyFinancialReportAnalyticsChart.rejected,
        (state, action) => {
          state.analyticsState = "failed";
          state.error =
            (action.payload as { message?: string } | undefined)?.message ||
            action.error.message ||
            "Failed to fetch analytics chart data.";
        },
      );
  },
});

export const {
  resetCompanyFinancialReportError,
  clearCompanyFinancialReport,
  setCompanyFinancialReportEstate,
} = companyFinancialReportSlice.actions;

export default companyFinancialReportSlice.reducer;

export const selectCompanyFinancialReport = (state: RootState) =>
  (state.companyFinancialReport as CompanyFinancialReportState | undefined) ??
  initialState;

export const selectCompanyFinancialReportChartData = (state: RootState) =>
  selectCompanyFinancialReport(state).chartData;

export const selectCompanyFinancialReportLoading = (state: RootState) => {
  const s = selectCompanyFinancialReport(state);
  return s.generateState === "isLoading" || s.analyticsState === "isLoading";
};

export const selectCompanyFinancialReportError = (state: RootState) =>
  selectCompanyFinancialReport(state).error;
