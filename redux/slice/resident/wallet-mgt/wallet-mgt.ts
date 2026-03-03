import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";


export interface WalletData {
  userId: string;
  balance: number;
  lockedBalance: number;
  /** Required for owner residentType */
  residentType?: "owner" | "tenant";
  ownerName?: string;
  bankCode?: string;
  bankSortCode?: string;
}

export const createWallet = createAsyncThunk(
  "wallet-mgt/createWallet",
  async (data: WalletData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/wallet-mgt", data);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Wallet creation failed",
      });
    }
  }
);

export const getWallet = createAsyncThunk(
  'wallet/getWallet',
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/wallet-mgt/${userId}?userId=${userId}`);
      return res.data;
    } catch (error: any) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to fetch wallet",
      });
    }
  }
);
