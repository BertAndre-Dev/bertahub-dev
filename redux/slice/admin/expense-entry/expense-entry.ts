import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type ExpenseEntry = {
  id?: string;
  _id?: string;
  headId: string;
  description: string;
  documentNumber: string;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ExpenseEntryListResponse = {
  success?: boolean;
  message?: string;
  data?: ExpenseEntry[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
};

export const createExpenseEntriesBulk = createAsyncThunk(
  "admin-expense-entry/createExpenseEntriesBulk",
  async (
    payload: {
      entries: Array<{
        headId: string;
        description: string;
        documentNumber: string;
        amount: number;
      }>;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post("/api/v1/expense-entry", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to create expense entries.",
      });
    }
  },
);

export const getExpenseEntriesByHead = createAsyncThunk(
  "admin-expense-entry/getExpenseEntriesByHead",
  async (
    {
      headId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: {
      headId: string;
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const qs = params.toString();
      const res = await axiosInstance.get(
        `/api/v1/expense-entry/head/${headId}${qs ? "?" + qs : ""}`,
      );
      return res.data as ExpenseEntryListResponse;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch expense entries for head.",
      });
    }
  },
);

export const updateExpenseEntry = createAsyncThunk(
  "admin-expense-entry/updateExpenseEntry",
  async (
    {
      id,
      headId,
      description,
      documentNumber,
      amount,
    }: {
      id: string;
      headId: string;
      description: string;
      documentNumber: string;
      amount: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(`/api/v1/expense-entry/${id}`, {
        headId,
        description,
        documentNumber,
        amount,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to update expense entry.",
      });
    }
  },
);

export const deleteExpenseEntry = createAsyncThunk(
  "admin-expense-entry/deleteExpenseEntry",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/expense-entry/${id}`);
      return res.data ? { id, ...res.data } : { id };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to delete expense entry.",
      });
    }
  },
);

