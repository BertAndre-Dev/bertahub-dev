import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface TransactionAnalyticsSummary {
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  netFlow: number;
  creditTransactions: number;
  debitTransactions: number;
  paidTransactions: number;
}

export interface TransactionTypeBreakdown {
  counts: { debit: number; credit: number };
  amounts: { debit: number; credit: number };
}

export interface TransactionStatusBreakdown {
  paid: number;
  pending: number;
  failed: number;
}

export interface ChargeAnalyticsRecentCharge {
  _id: string;
  walletId: string;
  type: string;
  amount: number;
  tx_ref: string;
  serviceCharge: number;
  description: string;
  createdAt: string;
  chargeType: string;
}

export interface ChargeBreakdownItem {
  totalAmount: number;
  chargeType: string;
  transactionCount: number;
}

export interface ChargeAnalyticsSummary {
  totalCharges: number;
  totalTransactions: number;
  averageCharge: number;
  maxCharge: number;
  minCharge: number;
  breakdown: ChargeBreakdownItem[];
}

export interface ChargeAnalytics {
  recentCharges: ChargeAnalyticsRecentCharge[];
  summary: ChargeAnalyticsSummary;
}

export interface TransactionAnalyticsTrendItem {
  [key: string]: string | number;
}

export interface TransactionAnalyticsData {
  summary: TransactionAnalyticsSummary;
  typeBreakdown: TransactionTypeBreakdown;
  statusBreakdown: TransactionStatusBreakdown;
  topUsers: unknown[];
  trend: TransactionAnalyticsTrendItem[];
  metrics: {
    averageAmount: number;
    maxAmount: number;
    minAmount: number;
  };
  chargeAnalytics: ChargeAnalytics;
}

export interface TransactionAnalyticsResponse {
  success: boolean;
  message: string;
  data: TransactionAnalyticsData;
}

export const getTransactionAnalyticsDashboard = createAsyncThunk(
  "estate-admin-transaction-analytics/getDashboard",
  async (
    {
      estateId,
      startDate,
      endDate,
    }: { estateId: string; startDate?: string; endDate?: string },
    { rejectWithValue }
  ) => {
    try {
      const params: Record<string, string> = { estateId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await axiosInstance.get<TransactionAnalyticsResponse>(
        "/api/v1/analytics/transactions/dashboard",
        { params }
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch transaction analytics.",
      });
    }
  }
);
