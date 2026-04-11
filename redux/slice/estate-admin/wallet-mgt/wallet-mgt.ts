import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

interface CreateWalletData {
  estateId: string;
  balance: number;
  lockedBalance: number;
  accountNumber: string;
  bankCode?: string;
}

export const createWallet = createAsyncThunk(
  "estate-admin-wallet-mgt/createWallet",
  async (data: CreateWalletData, { rejectWithValue }) => {
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
  "estate-admin-wallet/getWallet",
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

/** Get list of amounts credited to wallets in an estate. GET /api/v1/wallet-mgt/estate-credits */
export const getEstateCredits = createAsyncThunk(
  "estate-admin-wallet/getEstateCredits",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
    }: { estateId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      if (!estateId) {
        return rejectWithValue({
          message: "Estate ID is required to fetch estate credits",
        });
      }
      const res = await axiosInstance.get(`/api/v1/wallet-mgt/estate-credits/${estateId}`, {
        params: { estateId, page, limit },
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error.response?.data?.message || "Failed to fetch estate credits",
      });
    }
  },
);
