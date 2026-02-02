import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

interface WalletData {
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
        message: error.response?.data?.message || "Wallet creation failed",
      });
    }
  },
);

export const getWallet = createAsyncThunk(
  "wallet/getWallet",
  async (estateId: string, { rejectWithValue }) => {
    try {
      if (!estateId) {
        return rejectWithValue({
          message: "Estate ID is required to fetch wallet",
        });
      }


      const res = await axiosInstance.get(
        `/api/v1/wallet-mgt/estate/${estateId}`,
        {
          params: { estateId },
        },
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to fetch wallet",
      });
    }
  },
);
