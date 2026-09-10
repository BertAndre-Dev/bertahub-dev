import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  BillsSummaryData,
  ComplaintsDashboardData,
  ComplaintsSummaryData,
  MeterSummaryData,
} from "@/types/analytics";
import type {
  RoleBreakdownData,
  UserSummaryData,
} from "@/redux/slice/admin/user-analytics/user-analytics";
import {
  getCompanyBillsSummary,
  getCompanyComplaintsDashboard,
  getCompanyComplaintsSummary,
  getCompanyMeterSummary,
  getCompanyUserRoleBreakdown,
  getCompanyUserSummary,
} from "./company-overview-analytics";

type LoadStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyOverviewAnalyticsState {
  userSummary: UserSummaryData | null;
  userSummaryStatus: LoadStatus;
  userSummaryError: string | null;

  roleBreakdown: RoleBreakdownData | null;
  roleBreakdownStatus: LoadStatus;
  roleBreakdownError: string | null;

  meterSummary: MeterSummaryData | null;
  meterSummaryStatus: LoadStatus;
  meterSummaryError: string | null;

  billsSummary: BillsSummaryData | null;
  billsSummaryStatus: LoadStatus;
  billsSummaryError: string | null;

  complaintsSummary: ComplaintsSummaryData | null;
  complaintsSummaryStatus: LoadStatus;
  complaintsSummaryError: string | null;

  complaintsDashboard: ComplaintsDashboardData | null;
  complaintsDashboardStatus: LoadStatus;
  complaintsDashboardError: string | null;
}

const initialState: CompanyOverviewAnalyticsState = {
  userSummary: null,
  userSummaryStatus: "idle",
  userSummaryError: null,

  roleBreakdown: null,
  roleBreakdownStatus: "idle",
  roleBreakdownError: null,

  meterSummary: null,
  meterSummaryStatus: "idle",
  meterSummaryError: null,

  billsSummary: null,
  billsSummaryStatus: "idle",
  billsSummaryError: null,

  complaintsSummary: null,
  complaintsSummaryStatus: "idle",
  complaintsSummaryError: null,

  complaintsDashboard: null,
  complaintsDashboardStatus: "idle",
  complaintsDashboardError: null,
};

const companyOverviewAnalyticsSlice = createSlice({
  name: "companyOverviewAnalytics",
  initialState,
  reducers: {
    clearCompanyOverviewAnalytics: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCompanyUserSummary.pending, (state) => {
        state.userSummaryStatus = "isLoading";
        state.userSummaryError = null;
      })
      .addCase(getCompanyUserSummary.fulfilled, (state, action) => {
        state.userSummaryStatus = "succeeded";
        state.userSummary = action.payload?.data ?? null;
        state.userSummaryError = null;
      })
      .addCase(getCompanyUserSummary.rejected, (state, action) => {
        state.userSummaryStatus = "failed";
        state.userSummaryError = getApiErrorMessage(action.payload) ?? null;
      })

      .addCase(getCompanyUserRoleBreakdown.pending, (state) => {
        state.roleBreakdownStatus = "isLoading";
        state.roleBreakdownError = null;
      })
      .addCase(getCompanyUserRoleBreakdown.fulfilled, (state, action) => {
        state.roleBreakdownStatus = "succeeded";
        state.roleBreakdown = action.payload?.data ?? null;
        state.roleBreakdownError = null;
      })
      .addCase(getCompanyUserRoleBreakdown.rejected, (state, action) => {
        state.roleBreakdownStatus = "failed";
        state.roleBreakdownError = getApiErrorMessage(action.payload) ?? null;
      })

      .addCase(getCompanyMeterSummary.pending, (state) => {
        state.meterSummaryStatus = "isLoading";
        state.meterSummaryError = null;
      })
      .addCase(getCompanyMeterSummary.fulfilled, (state, action) => {
        state.meterSummaryStatus = "succeeded";
        state.meterSummary = action.payload?.data ?? null;
        state.meterSummaryError = null;
      })
      .addCase(getCompanyMeterSummary.rejected, (state, action) => {
        state.meterSummaryStatus = "failed";
        state.meterSummaryError = getApiErrorMessage(action.payload) ?? null;
      })

      .addCase(getCompanyBillsSummary.pending, (state) => {
        state.billsSummaryStatus = "isLoading";
        state.billsSummaryError = null;
      })
      .addCase(getCompanyBillsSummary.fulfilled, (state, action) => {
        state.billsSummaryStatus = "succeeded";
        state.billsSummary = action.payload?.data ?? null;
        state.billsSummaryError = null;
      })
      .addCase(getCompanyBillsSummary.rejected, (state, action) => {
        state.billsSummaryStatus = "failed";
        state.billsSummaryError = getApiErrorMessage(action.payload) ?? null;
      })

      .addCase(getCompanyComplaintsSummary.pending, (state) => {
        state.complaintsSummaryStatus = "isLoading";
        state.complaintsSummaryError = null;
      })
      .addCase(getCompanyComplaintsSummary.fulfilled, (state, action) => {
        state.complaintsSummaryStatus = "succeeded";
        state.complaintsSummary = action.payload?.data ?? null;
        state.complaintsSummaryError = null;
      })
      .addCase(getCompanyComplaintsSummary.rejected, (state, action) => {
        state.complaintsSummaryStatus = "failed";
        state.complaintsSummaryError =
          getApiErrorMessage(action.payload) ?? null;
      })

      .addCase(getCompanyComplaintsDashboard.pending, (state) => {
        state.complaintsDashboardStatus = "isLoading";
        state.complaintsDashboardError = null;
      })
      .addCase(getCompanyComplaintsDashboard.fulfilled, (state, action) => {
        state.complaintsDashboardStatus = "succeeded";
        state.complaintsDashboard = action.payload?.data ?? null;
        state.complaintsDashboardError = null;
      })
      .addCase(getCompanyComplaintsDashboard.rejected, (state, action) => {
        state.complaintsDashboardStatus = "failed";
        state.complaintsDashboardError =
          getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearCompanyOverviewAnalytics } =
  companyOverviewAnalyticsSlice.actions;

export const selectCompanyUserSummaryData = (
  state: RootState,
): UserSummaryData | null => state.companyOverviewAnalytics.userSummary;

export const selectCompanyUserSummaryLoading = (state: RootState): boolean =>
  state.companyOverviewAnalytics.userSummaryStatus === "isLoading";

export const selectCompanyUserSummaryError = (
  state: RootState,
): string | null => state.companyOverviewAnalytics.userSummaryError;

export const selectCompanyRoleBreakdownData = (
  state: RootState,
): RoleBreakdownData | null => state.companyOverviewAnalytics.roleBreakdown;

export const selectCompanyRoleBreakdownLoading = (state: RootState): boolean =>
  state.companyOverviewAnalytics.roleBreakdownStatus === "isLoading";

export const selectCompanyRoleBreakdownError = (
  state: RootState,
): string | null => state.companyOverviewAnalytics.roleBreakdownError;

export const selectCompanyMeterSummaryData = (
  state: RootState,
): MeterSummaryData | null => state.companyOverviewAnalytics.meterSummary;

export const selectCompanyMeterSummaryLoading = (state: RootState): boolean =>
  state.companyOverviewAnalytics.meterSummaryStatus === "isLoading";

export const selectCompanyMeterSummaryError = (
  state: RootState,
): string | null => state.companyOverviewAnalytics.meterSummaryError;

export const selectCompanyBillsSummaryData = (
  state: RootState,
): BillsSummaryData | null => state.companyOverviewAnalytics.billsSummary;

export const selectCompanyBillsSummaryLoading = (state: RootState): boolean =>
  state.companyOverviewAnalytics.billsSummaryStatus === "isLoading";

export const selectCompanyBillsSummaryError = (
  state: RootState,
): string | null => state.companyOverviewAnalytics.billsSummaryError;

export const selectCompanyComplaintsSummaryData = (
  state: RootState,
): ComplaintsSummaryData | null =>
  state.companyOverviewAnalytics.complaintsSummary;

export const selectCompanyComplaintsSummaryLoading = (
  state: RootState,
): boolean =>
  state.companyOverviewAnalytics.complaintsSummaryStatus === "isLoading";

export const selectCompanyComplaintsSummaryError = (
  state: RootState,
): string | null => state.companyOverviewAnalytics.complaintsSummaryError;

export const selectCompanyComplaintsDashboardData = (
  state: RootState,
): ComplaintsDashboardData | null =>
  state.companyOverviewAnalytics.complaintsDashboard;

export const selectCompanyComplaintsDashboardLoading = (
  state: RootState,
): boolean =>
  state.companyOverviewAnalytics.complaintsDashboardStatus === "isLoading";

export const selectCompanyComplaintsDashboardError = (
  state: RootState,
): string | null => state.companyOverviewAnalytics.complaintsDashboardError;

export default companyOverviewAnalyticsSlice.reducer;
