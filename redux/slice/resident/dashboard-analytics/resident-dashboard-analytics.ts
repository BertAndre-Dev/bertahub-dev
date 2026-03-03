import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

// ----- Bills: use existing resident bills API (list) -----
export interface ResidentBillItem {
  _id?: string;
  name?: string;
  amount?: number;
  status?: string;
  amountPaid?: number;
  [key: string]: unknown;
}

export interface ResidentBillsResponse {
  success?: boolean;
  data?: ResidentBillItem[] | { data?: ResidentBillItem[]; total?: number };
  message?: string;
}

export const getResidentDashboardBills = createAsyncThunk(
  "resident-dashboard-analytics/getBills",
  async (
    { residentId }: { residentId: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get<ResidentBillsResponse>(
        `/api/v1/bills-mgt/resident/${residentId}`,
        { params: { page: 1, limit: 500 } }
      );
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : (data as { data?: ResidentBillItem[] })?.data ?? [];
      return { list };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to fetch bills",
      });
    }
  }
);

// ----- Transactions: use existing transaction history API -----
export interface ResidentTransactionItem {
  _id?: string;
  amount?: number;
  type?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface ResidentTransactionsResponse {
  success?: boolean;
  data?: ResidentTransactionItem[] | { data?: ResidentTransactionItem[]; total?: number };
  message?: string;
}

export const getResidentDashboardTransactions = createAsyncThunk(
  "resident-dashboard-analytics/getTransactions",
  async (
    { userId }: { userId: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get<ResidentTransactionsResponse>(
        "/api/v1/transaction-mgt/history",
        { params: { userId, page: 1, limit: 500 } }
      );
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : (data as { data?: ResidentTransactionItem[] })?.data ?? [];
      return { list };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to fetch transactions",
      });
    }
  }
);

// ----- Vending: vend history for a meter (resident may have one or more meters) -----
export interface ResidentVendItem {
  _id?: string;
  amount?: number;
  createdAt?: string;
  meterNumber?: string;
  [key: string]: unknown;
}

export interface ResidentVendHistoryResponse {
  success?: boolean;
  data?: ResidentVendItem[] | { data?: ResidentVendItem[]; total?: number };
  message?: string;
}

export const getResidentDashboardVendHistory = createAsyncThunk(
  "resident-dashboard-analytics/getVendHistory",
  async (
    { meterNumber }: { meterNumber: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get<ResidentVendHistoryResponse>(
        `/api/v1/meters/vend-history/${meterNumber}`,
        { params: { page: 1, limit: 100 } }
      );
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : (data as { data?: ResidentVendItem[] })?.data ?? [];
      return { list, meterNumber };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to fetch vend history",
      });
    }
  }
);
