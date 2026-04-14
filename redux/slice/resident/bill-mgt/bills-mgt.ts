import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";



interface BillData {
  billId: string;
  userId: string;
  walletId: string;
  addressId?: string;
  frequency: string;
  amountPaid: number;
}


// Get bills by estate (with pagination)
export const getBillsByEstate = createAsyncThunk(
  "bills/getBillsByEstate",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
    }: { estateId: string | { id?: string; _id?: string }; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const normalizedEstateId =
        typeof estateId === "string"
          ? estateId
          : estateId?._id || estateId?.id || "";

      const res = await axiosInstance.get(
        `/api/v1/bills-mgt/bills/${normalizedEstateId}?page=${page}&limit=${limit}`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || "Failed to fetch bills",
      });
    }
  },
);


// Get resident bills (with pagination)
export const getResidentBills = createAsyncThunk(
  "bills/getResidentBills",
  async (
    { residentId, page = 1, limit = 10 }: { residentId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/bills-mgt/resident/${residentId}?page=${page}&limit=${limit}`
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || "Failed to fetch bills",
      });
    }
  }
);


// Get bill
export const getBill = createAsyncThunk(
    'bills/getBill',
    async(billId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/bills-mgt/${billId}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || "Failed to load bill",
            });
        }
    }
);


// Pay for bill
export const payBill = createAsyncThunk(
    "bills/payBill",
    async(data: BillData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/v1/bills-mgt/pay', data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || "Failed to pay bill",
            });
        }
    }
);


