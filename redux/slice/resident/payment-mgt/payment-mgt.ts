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
  "resident-payment-mgt/getBanks",
  async (country: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<GetBanksResponse>(
        "/api/v1/payment-mgt/banks",
        { params: { country } }
      );
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      return rejectWithValue({ message: "Failed to load banks" });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to load banks",
      });
    }
  }
);

export const verifyBankAccount = createAsyncThunk(
  "resident-payment-mgt/verifyBankAccount",
  async (
    { accountNumber, bankCode }: VerifyBankAccountPayload,
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        "/api/v1/payment-mgt/verify-bank-account",
        {
          params: {
            accountNumber: accountNumber.trim(),
            bankCode,
          },
        }
      );
      const data = res.data as VerifyBankAccountResponse & { data?: { account_name?: string } };
      const accountName = data?.account_name ?? data?.data?.account_name;
      if (accountName) {
        return { accountName };
      }
      return rejectWithValue({ message: "Account not found" });
    } catch {
      return rejectWithValue({ message: "Account not found" });
    }
  }
);
