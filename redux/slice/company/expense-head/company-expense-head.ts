import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type CompanyExpenseHead = {
  id?: string;
  _id?: string;
  estateId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyExpenseHeadListResponse = {
  success?: boolean;
  message?: string;
  data?: CompanyExpenseHead[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
};

export const createCompanyExpenseHead = createAsyncThunk(
  "company-expense-head/createCompanyExpenseHead",
  async (
    data: { estateId: string; name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post("/api/v1/expense-head", data);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to create expense head.",
      });
    }
  },
);

export const fetchCompanyExpenseHeads = createAsyncThunk(
  "company-expense-head/fetchCompanyExpenseHeads",
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
      params.set("estateId", estateId);
      params.set("id", estateId);

      const qs = params.toString();
      const res = await axiosInstance.get(
        `/api/v1/expense-head/estate/${estateId}${qs ? "?" + qs : ""}`,
      );
      return res.data as CompanyExpenseHeadListResponse;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch expense heads.",
      });
    }
  },
);

export const fetchCompanyExpenseHeadById = createAsyncThunk(
  "company-expense-head/fetchCompanyExpenseHeadById",
  async (id: string, { rejectWithValue }) => {
    try {
      try {
        const res = await axiosInstance.get(`/api/v1/expense-head/${id}`, {
          params: { id },
        });
        return res.data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status !== 404 && status !== 500) throw err;
      }

      const res2 = await axiosInstance.get(`/api/v1/expense-head`, {
        params: { id },
      });
      return res2.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch expense head.",
      });
    }
  },
);

export const updateCompanyExpenseHead = createAsyncThunk(
  "company-expense-head/updateCompanyExpenseHead",
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to update expense head.",
      });
    }
  },
);

export const deleteCompanyExpenseHead = createAsyncThunk(
  "company-expense-head/deleteCompanyExpenseHead",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/expense-head/${id}`, {
        params: { id },
      });
      return res.data ? { id, ...res.data } : { id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to delete expense head.",
      });
    }
  },
);
