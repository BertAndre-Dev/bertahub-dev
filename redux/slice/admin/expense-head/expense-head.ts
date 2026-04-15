import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type ExpenseHead = {
  id?: string;
  _id?: string;
  estateId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ExpenseHeadListResponse = {
  success?: boolean;
  message?: string;
  data?: ExpenseHead[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
};

export const createExpenseHead = createAsyncThunk(
  "admin-expense-head/createExpenseHead",
  async (
    data: { estateId: string; name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post("/api/v1/expense-head", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to create expense head.",
      });
    }
  },
);

export const fetchExpenseHeads = createAsyncThunk(
  "admin-expense-head/fetchExpenseHeads",
  async (
    {
      estateId,
      page = 1,
      limit = 12,
      startDate,
      endDate,
    }: {
      estateId: string;
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
      // Some backend versions also require the estate id as a query param.
      params.set("estateId", estateId);
      params.set("id", estateId);

      const qs = params.toString();
      const res = await axiosInstance.get(
        `/api/v1/expense-head/estate/${estateId}${qs ? "?" + qs : ""}`,
      );
      return res.data as ExpenseHeadListResponse;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch expense heads.",
      });
    }
  },
);

export const fetchExpenseHeadById = createAsyncThunk(
  "admin-expense-head/fetchExpenseHeadById",
  async (id: string, { rejectWithValue }) => {
    try {
      // Backend implementations differ: some require `?id=` even with path param.
      try {
        const res = await axiosInstance.get(`/api/v1/expense-head/${id}`, {
          params: { id },
        });
        return res.data;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 404 && status !== 500) throw err;
      }

      const res2 = await axiosInstance.get(`/api/v1/expense-head`, {
        params: { id },
      });
      return res2.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch expense head.",
      });
    }
  },
);

export const updateExpenseHead = createAsyncThunk(
  "admin-expense-head/updateExpenseHead",
  async (
    {
      id,
      name,
      description,
    }: { id: string; name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(`/api/v1/expense-head/${id}`, {
        name,
        description,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to update expense head.",
      });
    }
  },
);

export const deleteExpenseHead = createAsyncThunk(
  "admin-expense-head/deleteExpenseHead",
  async (id: string, { rejectWithValue }) => {
    try {
      // Backend implementations differ: some expect `id` as a query param (Swagger),
      // others accept the id as a path param. Try query-param first, then fallback.
      try {
        const res = await axiosInstance.delete(`/api/v1/expense-head/{id}`, {
          params: { id },
        });
        return res.data ? { id, ...res.data } : { id };
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 404 && status !== 500) throw err;
      }

      const res2 = await axiosInstance.delete(`/api/v1/expense-head/${id}`, {
        params: { id },
      });
      return res2.data ? { id, ...res2.data } : { id };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to delete expense head.",
      });
    }
  },
);

