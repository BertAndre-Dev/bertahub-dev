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
      search = "",
      forGrandTotal = false,
    }: {
      page?: number;
      limit?: number;
      type?: string;
      search?: string;
      /**
       * When true, the slice will use this response only to
       * compute the grand total amount and will NOT overwrite
       * the paginated list in state.
       */
      forGrandTotal?: boolean;
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

      if (search) {
        params.append("search", search);
      }

      const res = await axiosInstance.get(
        `/api/v1/transaction-mgt/all-history?${params.toString()}`
      );

      // We return the full response plus the flag so the slice
      // can decide how to store it.
      return { ...(res.data as any), forGrandTotal };
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// Get single transaction by ID
export const getTransactionById = createAsyncThunk(
  "super-admin-transactions/getTransactionById",
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/transaction-mgt/by-id/${transactionId}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed to fetch transaction" });
    }
  }
);

// Verify transaction (POST /api/v1/transaction-mgt/verify?tx_ref=...)
export const verifyTransaction = createAsyncThunk(
  "super-admin-transactions/verifyTransaction",
  async (tx_ref: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        `/api/v1/transaction-mgt/verify?tx_ref=${encodeURIComponent(tx_ref)}`
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to verify transaction" }
      );
    }
  }
);
