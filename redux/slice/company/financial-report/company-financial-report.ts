import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type CompanyAnalyticsChartPoint = {
  date: string;
  vending: number;
  bills: number;
  revenue: number;
  expenses: number;
};

export type CompanyFinancialReportGenerateResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reportPeriod?: { startDate: string; endDate: string };
    revenue?: {
      vendingRevenue: number;
      billPaymentRevenue: number;
      totalRevenue: number;
    };
    expenses?: {
      totalExpenses: number;
      byHead: Array<{
        _id: string;
        headName: string;
        totalAmount: number;
        entryCount: number;
      }>;
    };
    summary?: {
      totalRevenue: number;
      totalExpenses: number;
      netProfitLoss: number;
      profitMargin: string;
      status: string;
    };
  };
};

export type CompanyFinancialReportAnalyticsChartResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reportPeriod?: { startDate: string; endDate: string };
    chartData: CompanyAnalyticsChartPoint[];
    summary?: { totalDataPoints?: number; dateRange?: string };
  };
};

export const fetchCompanyFinancialReportGenerate = createAsyncThunk(
  "company-financial-report/fetchGenerate",
  async (
    params: { estateId: string; startDate?: string; endDate?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get<CompanyFinancialReportGenerateResponse>(
        "/api/v1/financial-report/generate",
        { params },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to generate financial report.",
      });
    }
  },
);

export const fetchCompanyFinancialReportAnalyticsChart = createAsyncThunk(
  "company-financial-report/fetchAnalyticsChart",
  async (
    params: { estateId: string; startDate?: string; endDate?: string },
    { rejectWithValue },
  ) => {
    try {
      const res =
        await axiosInstance.get<CompanyFinancialReportAnalyticsChartResponse>(
          "/api/v1/financial-report/analytics-chart",
          { params },
        );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch analytics chart data.",
      });
    }
  },
);
