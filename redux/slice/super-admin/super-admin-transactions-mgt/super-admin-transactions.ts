import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";

export interface TransactionUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface TransactionEstate {
  id: string;
  name?: string;
}

export interface TransactionData {
  id: string;
  _id?: string;
  type: "debit" | "credit";
  amount: number;
  paymentStatus: "paid" | "pending" | "failed";
  tx_ref: string;
  serviceCharge?: number;
  description: string;
  createdAt: string;
  userId?: TransactionUser;
  estateId?: TransactionEstate;
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
      estate = "",
      startDate = "",
      endDate = "",
      forGrandTotal = false,
      forExport = false,
    }: {
      page?: number;
      limit?: number;
      type?: string;
      search?: string;
      estate?: string;
      startDate?: string;
      endDate?: string;
      /**
       * When true, the slice will use this response only to
       * compute the grand total amount and will NOT overwrite
       * the paginated list in state.
       */
      forGrandTotal?: boolean;
      /**
       * When true, this call is used only for exporting data.
       * The slice should not overwrite the current list.
       */
      forExport?: boolean;
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

      if (estate) {
        params.append("estate", estate);
      }

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      const res = await axiosInstance.get(
        `/api/v1/transaction-mgt/all-history?${params.toString()}`
      );

      // We return the full response plus the flags so the slice
      // can decide how to store it.
      return { ...(res.data as any), forGrandTotal, forExport };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  }
);

/** GET /api/v1/transaction-mgt/history?userId= — paginated history for one user */
export const getUserTransactionHistory = createAsyncThunk(
  "super-admin-transactions/getUserTransactionHistory",
  async (
    {
      userId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: {
      userId: string;
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get("/api/v1/transaction-mgt/history", {
        params: {
          userId,
          page,
          limit,
          startDate,
          endDate,
        },
      });
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// Get single transaction by ID
export const getTransactionById = createAsyncThunk(
  "super-admin-transactions/getTransactionById",
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/transaction-mgt/by-id/${transactionId}`);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
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
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  }
);
