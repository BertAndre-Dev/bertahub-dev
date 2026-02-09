import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface BankItem {
  id: number;
  code: string;
  name: string;
}

export interface GetBanksResponse {
  success?: boolean;
  data?: BankItem[];
}

export interface VerifyBankAccountPayload {
  accountNumber: string;
  bankCode: string;
}

export interface VerifyBankAccountResponse {
  account_name?: string;
}

export const getBanks = createAsyncThunk(
  "estate-admin-fund-wallet/getBanks",
  async (country: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<GetBanksResponse>(
        "/api/v1/payment-mgt/banks",
        { params: { country } }
      );
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      return rejectWithValue({
        message: "Failed to load banks",
      });
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to load banks",
      });
    }
  }
);

export const verifyBankAccount = createAsyncThunk(
  "estate-admin-fund-wallet/verifyBankAccount",
  async (
    { accountNumber, bankCode }: VerifyBankAccountPayload,
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get<VerifyBankAccountResponse>(
        "/api/v1/payment-mgt/verify-bank-account",
        {
          params: {
            accountNumber: accountNumber.trim(),
            bankCode,
          },
        }
      );
      if (res.data?.account_name) {
        return { accountName: res.data.account_name };
      }
      return rejectWithValue({ message: "Account not found" });
    } catch {
      return rejectWithValue({ message: "Account not found" });
    }
  }
);
