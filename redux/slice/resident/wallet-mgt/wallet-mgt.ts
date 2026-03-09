import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";


export interface WalletData {
  userId: string;
  balance: number;
  lockedBalance: number;
  /** Required for owner (bank-linked) wallet; optional for tenant. */
  bankCode?: string;
  /** Optional: account number when bankCode is provided. */
  accountNumber?: string;
}

export interface TransferToBalancePayload {
  amount: number;
  description?: string;
}

export const createWallet = createAsyncThunk(
  "wallet-mgt/createWallet",
  async (data: WalletData, { rejectWithValue }) => {
    try {
      const payload: Record<string, unknown> = {
        userId: data.userId,
        balance: data.balance,
        lockedBalance: data.lockedBalance,
      };
      if (data.bankCode != null && data.bankCode !== "") {
        payload.bankCode = data.bankCode;
        if (data.accountNumber != null && data.accountNumber !== "") {
          payload.accountNumber = data.accountNumber;
        }
      }
      const res = await axiosInstance.post("/api/v1/wallet-mgt", payload);
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

/** OWNER only: move withdrawableBalance -> main balance */
export const transferToBalance = createAsyncThunk(
  "wallet-mgt/transferToBalance",
  async (data: TransferToBalancePayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/wallet-mgt/transfer-to-balance",
        data,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to transfer funds to main balance",
      });
    }
  },
);
