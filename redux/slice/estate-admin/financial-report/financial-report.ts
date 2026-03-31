import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type AnalyticsChartPoint = {
  date: string;
  vending: number;
  bills: number;
  revenue: number;
  expenses: number;
};

export type FinancialReportGenerateResponse = {
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

export type FinancialReportAnalyticsChartResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reportPeriod?: { startDate: string; endDate: string };
    chartData: AnalyticsChartPoint[];
    summary?: { totalDataPoints?: number; dateRange?: string };
  };
};

export const fetchFinancialReportGenerate = createAsyncThunk(
  "estate-admin-financial-report/fetchGenerate",
  async (
    params: { estateId: string; startDate?: string; endDate?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get<FinancialReportGenerateResponse>(
        "/api/v1/financial-report/generate",
        { params },
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to generate financial report.",
      });
    }
  },
);

export const fetchFinancialReportAnalyticsChart = createAsyncThunk(
  "estate-admin-financial-report/fetchAnalyticsChart",
  async (
    params: { estateId: string; startDate?: string; endDate?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get<FinancialReportAnalyticsChartResponse>(
        "/api/v1/financial-report/analytics-chart",
        { params },
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch analytics chart data.",
      });
    }
  },
);

