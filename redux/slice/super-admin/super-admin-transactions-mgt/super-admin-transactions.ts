import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface TransactionData {
  _id: string;
  type: "debit" | "credit";
  amount: number;
  paymentStatus: "paid" | "pending" | "failed";
  tx_ref: string;
  description: string;
  createdAt: string;
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  estate: {
    name?: string;
  };
}

export interface TransactionPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  data: TransactionData[];
  pagination: TransactionPagination;
}

export const getAllTransactionHistory = createAsyncThunk(
  "super-admin-transactions/getAllTransactionHistory",
  async (
    {
      page = 1,
      limit = 10,
      type = "",
      search = "",  // ✅ add this
    }: {
      page?: number;
      limit?: number;
      type?: string;
      search?: string;  // ✅ add this
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();

      params.append("page", String(page));
      params.append("limit", String(limit));

      if (type) {
        params.append("type", type);
      }

      if (search) {  // ✅ add this
        params.append("search", search);
      }

      const res = await axiosInstance.get(
        `/api/v1/transaction-mgt/all-history?${params.toString()}`
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);
