import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

interface BillData {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number;
}

export interface CreateBillForAddressPayload {
  billId: string;
  addressId: string;
  estateId: string;
  frequency: string;
  amountPerBillingPeriod: number;
  startDate: string;
}

export interface BillsForAddressItem {
  id?: string;
  billId?: string;
  addressId?: string;
  estateId?: string;
  userId?: string;
  billName?: string;
  frequency?: string;
  amountPaid?: number;
  startDate?: string;
  nextDueDate?: string;
  status?: string;
  lastPaymentDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface BillsForAddressResponse {
  success?: boolean;
  message?: string;
  data?: BillsForAddressItem[];
  totals?: {
    totalRecords: number;
    totalBills: number;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface GetBillsForAddressParams {
  addressId: string;
  estateId: string;
  page?: number;
  limit?: number;
}

// Create estate bill
export const createBill = createAsyncThunk(
  "bills/createBill",
  async (data: BillData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/bills-mgt", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);

// Update existing bill
export const updateBill = createAsyncThunk(
  "bills/updateBill",
  async (
    { billId, data }: { billId: string; data: BillData },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(`/api/v1/bills-mgt/${billId}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);

// Delete existing bill
export const deleteBill = createAsyncThunk(
  "bills/deleteBill",
  async (billId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/bills-mgt/${billId}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);

// Suspend an existing bill
export const suspendBill = createAsyncThunk(
  "bills/suspendBill",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/bills-mgt/${id}/suspend-bill`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);

// Activate an existing bill
export const activateBill = createAsyncThunk(
  "bills/activateBill",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/bills-mgt/${id}/activate-bill`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);

// Get bill
export const getBill = createAsyncThunk(
  "bills/getBill",
  async (billId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/bills-mgt/${billId}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);

// Get bills by estate (with pagination)
export const getBillsByEstate = createAsyncThunk(
  "bills/getBillsByEstate",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
    }: { estateId: string; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/bills-mgt/bills/${estateId}?page=${page}&limit=${limit}`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || "Failed to fetch bills",
      });
    }
  },
);

// Create bill assignment for a specific address
export const createBillForAddress = createAsyncThunk(
  "bills/createBillForAddress",
  async (data: CreateBillForAddressPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/bills-mgt/for-address/create",
        data,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ??
          error.res?.data?.message ??
          "Failed to create bill for address",
      });
    }
  },
);

// Get assigned bills for a specific address
export const getBillsForAddress = createAsyncThunk(
  "bills/getBillsForAddress",
  async (
    { addressId, estateId, page = 1, limit = 10 }: GetBillsForAddressParams,
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get<BillsForAddressResponse>(
        `/api/v1/bills-mgt/for-address`,
        {
          params: { addressId, estateId, page, limit },
        },
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ??
          "Failed to fetch bills assigned to address",
      });
    }
  },
);
