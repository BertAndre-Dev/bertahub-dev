import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface SuperAdminBillsSummary {
  totalBills: number;
  activeBills: number;
  suspendedBills: number;
}

export interface SuperAdminBillsPaymentStatistics {
  _id?: string | null;
  totalAssignments: number;
  paidAssignments: number;
  unpaidAssignments: number;
  totalAmountCollected: number;
  totalAmountExpected: number;
  paymentRate: number;
  collectionRate: number;
}

export interface SuperAdminTopBillByCollection {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  totalAmountCollected: number;
  totalAssignments: number;
  paidCount: number;
}

export interface SuperAdminBillsStatusBreakdown {
  active: number;
  suspended: number;
}

export interface SuperAdminResidentBillStatusItem {
  count: number;
  totalAmount: number;
  totalPaid: number;
}

export interface SuperAdminBillsResidentBillStatus {
  paid: SuperAdminResidentBillStatusItem;
  unpaid: SuperAdminResidentBillStatusItem;
}

export interface SuperAdminBillsAveragePaymentTime {
  averagePaymentDays: number;
  minPaymentDays: number;
  maxPaymentDays: number;
  totalPaidBills: number;
}

export interface SuperAdminBillsAnalyticsData {
  summary: SuperAdminBillsSummary;
  paymentStatistics: SuperAdminBillsPaymentStatistics;
  statusBreakdown: SuperAdminBillsStatusBreakdown;
  residentBillStatus: SuperAdminBillsResidentBillStatus;
  topBillsByCollection: SuperAdminTopBillByCollection[];
  billsWithHighestUnpaid: unknown[];
  averagePaymentTime: SuperAdminBillsAveragePaymentTime;
  residentsWithMostUnpaidBills: unknown[];
}

export interface SuperAdminBillsAnalyticsResponse {
  success: boolean;
  message: string;
  data: SuperAdminBillsAnalyticsData;
}

export const getSuperAdminBillsAnalyticsDashboard = createAsyncThunk(
  "super-admin-bills-analytics/getDashboard",
  async (
    { estateId }: { estateId: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get<SuperAdminBillsAnalyticsResponse>(
        "/analytics/bills/dashboard",
        { params: { estateId } }
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch bills analytics.",
      });
    }
  }
);
