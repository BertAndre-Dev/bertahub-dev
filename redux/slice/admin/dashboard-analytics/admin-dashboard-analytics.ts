import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

// ----- Bills (reuse same API as estate-admin) -----
export interface BillsAnalyticsSummary {
  totalBills: number;
  activeBills: number;
  suspendedBills: number;
}

export interface BillsPaymentStatistics {
  _id?: string | null;
  totalAssignments: number;
  paidAssignments: number;
  unpaidAssignments: number;
  totalAmountCollected: number;
  totalAmountExpected: number;
  paymentRate: number;
  collectionRate: number;
}

export interface TopBillByCollection {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  totalAmountCollected: number;
  totalAssignments: number;
  paidCount: number;
}

export interface AdminBillsAnalyticsData {
  summary: BillsAnalyticsSummary;
  paymentStatistics: BillsPaymentStatistics;
  topBillsByCollection: TopBillByCollection[];
  [key: string]: unknown;
}

export interface AdminBillsAnalyticsResponse {
  success: boolean;
  message: string;
  data: AdminBillsAnalyticsData;
}

export const getAdminBillsDashboard = createAsyncThunk(
  "admin-dashboard-analytics/getBillsDashboard",
  async ({ estateId }: { estateId: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<AdminBillsAnalyticsResponse>(
        "/analytics/bills/dashboard",
        { params: { estateId } }
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch bills analytics.",
      });
    }
  }
);

// ----- Transactions -----
export interface AdminTransactionSummary {
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  netFlow: number;
  creditTransactions: number;
  debitTransactions: number;
  paidTransactions: number;
}

export interface AdminTransactionTypeBreakdown {
  counts: { debit: number; credit: number };
  amounts: { debit: number; credit: number };
}

export interface AdminChargeBreakdownItem {
  totalAmount: number;
  chargeType: string;
  transactionCount: number;
}

export interface AdminChargeAnalyticsSummary {
  totalCharges: number;
  totalTransactions: number;
  averageCharge: number;
  maxCharge: number;
  minCharge: number;
  breakdown: AdminChargeBreakdownItem[];
}

export interface AdminTransactionAnalyticsData {
  summary: AdminTransactionSummary;
  typeBreakdown: AdminTransactionTypeBreakdown;
  trend: Array<Record<string, string | number>>;
  chargeAnalytics: { summary: AdminChargeAnalyticsSummary; recentCharges?: unknown[] };
  [key: string]: unknown;
}

export interface AdminTransactionAnalyticsResponse {
  success: boolean;
  message: string;
  data: AdminTransactionAnalyticsData;
}

export const getAdminTransactionDashboard = createAsyncThunk(
  "admin-dashboard-analytics/getTransactionDashboard",
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
      const res = await axiosInstance.get<AdminTransactionAnalyticsResponse>(
        "/api/v1/analytics/transactions/dashboard",
        { params }
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch transaction analytics.",
      });
    }
  }
);

// ----- Meter / Vending -----
export interface AdminMeterSummary {
  totalMeters: number;
  activeMeters: number;
  assignedMeters: number;
  unassignedMeters: number;
}

export interface AdminMeterAnalyticsData {
  summary: AdminMeterSummary;
  lastSeenTrend: Array<Record<string, unknown>>;
  readingTrend: Array<Record<string, unknown>>;
  averageCreditMetrics?: { averageCredit: number; totalCredit: number; meterCount: number };
  [key: string]: unknown;
}

export interface AdminMeterAnalyticsResponse {
  success: boolean;
  message: string;
  data: AdminMeterAnalyticsData;
}

export const getAdminMeterDashboard = createAsyncThunk(
  "admin-dashboard-analytics/getMeterDashboard",
  async ({ estateId }: { estateId: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<AdminMeterAnalyticsResponse>(
        "/analytics/meters/dashboard",
        { params: { estateId } }
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch meter analytics.",
      });
    }
  }
);
