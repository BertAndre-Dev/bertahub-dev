import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";


interface WalletData {
  userId: string;
  balance: number;
  lockedBalance: number;
}


export const createWallet = createAsyncThunk(
  "wallet-mgt/createWallet",
  async (data: WalletData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/wallet-mgt", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message || "Wallet creation failed",
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
      return rejectWithValue({
        message: error.res?.data?.message || "Failed to fetch wallet",
      });
    }
  }
);

