import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type CompanyExpenseEntry = {
  id?: string;
  _id?: string;
  headId: string;
  description: string;
  documentNumber: string;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyExpenseEntryListResponse = {
  success?: boolean;
  message?: string;
  data?: CompanyExpenseEntry[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
};

export const createCompanyExpenseEntries = createAsyncThunk(
  "company-expense-entry/createCompanyExpenseEntries",
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
      if (payload.entries.length > 100) {
        return rejectWithValue({
          message: "Max 100 entries per request.",
        });
      }
      const res = await axiosInstance.post("/api/v1/expense-entry", payload);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to create expense entries.",
      });
    }
  },
);

export const fetchCompanyExpenseEntries = createAsyncThunk(
  "company-expense-entry/fetchCompanyExpenseEntries",
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
      return res.data as CompanyExpenseEntryListResponse;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch expense entries for head.",
      });
    }
  },
);

export const fetchCompanyExpenseEntryById = createAsyncThunk(
  "company-expense-entry/fetchCompanyExpenseEntryById",
  async (id: string, { rejectWithValue }) => {
    try {
      try {
        const res = await axiosInstance.get(`/api/v1/expense-entry/${id}`, {
          params: { id },
        });
        return res.data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status !== 404 && status !== 500) throw err;
      }

      const res2 = await axiosInstance.get(`/api/v1/expense-entry`, {
        params: { id },
      });
      return res2.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch expense entry.",
      });
    }
  },
);

export const updateCompanyExpenseEntry = createAsyncThunk(
  "company-expense-entry/updateCompanyExpenseEntry",
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to update expense entry.",
      });
    }
  },
);

export const deleteCompanyExpenseEntry = createAsyncThunk(
  "company-expense-entry/deleteCompanyExpenseEntry",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/expense-entry/${id}`);
      return res.data ? { id, ...res.data } : { id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to delete expense entry.",
      });
    }
  },
);
