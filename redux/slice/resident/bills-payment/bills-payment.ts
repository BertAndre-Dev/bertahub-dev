import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type BillsCategory = {
  category_code?: string;
  code?: string;
  name?: string;
  label?: string;
  description?: string;
  product?: string;
} & Record<string, unknown>;

export type BillsBiller = {
  biller_code?: string;
  code?: string;
  name?: string;
  label?: string;
  short_name?: string;
  category_code?: string;
} & Record<string, unknown>;

export type BillsItem = {
  item_code?: string;
  code?: string;
  name?: string;
  label?: string;
  amount?: number;
  fee?: number;
  currency?: string;
  biller_code?: string;
  service_type?: string;
} & Record<string, unknown>;

export type ValidateBillPayload = {
  country: string;
  biller_code: string;
  service_type: string;
  bill_ref: string;
};

export type PayBillPayload = {
  country: string;
  customer_id: string;
  item_code: string;
  amount: number;
  biller_code: string;
  reference: string;
  callback_url?: string;
  pin: string;
};

export type BillHistoryParams = {
  page?: number;
  limit?: number;
  product?: string;
  status?: "successful" | "pending" | "failed" | (string & {});
  start_date?: string;
  end_date?: string;
};

export const getBillCategories = createAsyncThunk(
  "residentBillsPayment/getBillCategories",
  async (
    { country }: { country: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get("/api/v1/bills/categories", {
        params: { country },
      });
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch bill categories.",
      });
    }
  },
);

export const getBillersByCategory = createAsyncThunk(
  "residentBillsPayment/getBillersByCategory",
  async (
    { country, category_code }: { country: string; category_code: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get("/api/v1/bills/billers", {
        params: { country, category_code },
      });
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to fetch billers.",
      });
    }
  },
);

export const getBillItemsByBiller = createAsyncThunk(
  "residentBillsPayment/getBillItemsByBiller",
  async (
    { country, biller_code }: { country: string; biller_code: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get("/api/v1/bills/items", {
        params: { country, biller_code },
      });
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch bill items.",
      });
    }
  },
);

export const validateBill = createAsyncThunk(
  "residentBillsPayment/validateBill",
  async (payload: ValidateBillPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/bills/validate", payload);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message || "Bill validation failed.",
      });
    }
  },
);

export const payBillViaWallet = createAsyncThunk(
  "residentBillsPayment/payBillViaWallet",
  async (payload: PayBillPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/bills/pay", payload);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to initiate bill payment.",
      });
    }
  },
);

export const getBillPaymentHistory = createAsyncThunk(
  "residentBillsPayment/getBillPaymentHistory",
  async (params: BillHistoryParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/api/v1/bills/history", {
        params,
      });
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to load bill payment history.",
      });
    }
  },
);

