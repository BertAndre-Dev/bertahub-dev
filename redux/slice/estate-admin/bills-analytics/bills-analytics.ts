import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

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

export interface BillsStatusBreakdown {
  active: number;
  suspended: number;
}

export interface ResidentBillStatusItem {
  count: number;
  totalAmount: number;
  totalPaid: number;
}

export interface BillsResidentBillStatus {
  paid: ResidentBillStatusItem;
  unpaid: ResidentBillStatusItem;
}

export interface BillsAveragePaymentTime {
  averagePaymentDays: number;
  minPaymentDays: number;
  maxPaymentDays: number;
  totalPaidBills: number;
}

export interface BillsAnalyticsData {
  summary: BillsAnalyticsSummary;
  paymentStatistics: BillsPaymentStatistics;
  statusBreakdown: BillsStatusBreakdown;
  residentBillStatus: BillsResidentBillStatus;
  topBillsByCollection: TopBillByCollection[];
  billsWithHighestUnpaid: unknown[];
  averagePaymentTime: BillsAveragePaymentTime;
  residentsWithMostUnpaidBills: unknown[];
}

export interface BillsAnalyticsResponse {
  success: boolean;
  message: string;
  data: BillsAnalyticsData;
}

export const getBillsAnalyticsDashboard = createAsyncThunk(
  "estate-admin-bills-analytics/getDashboard",
  async (
    { estateId }: { estateId: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get<BillsAnalyticsResponse>(
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
