import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface CreateCompanyWalletData {
  companyId: string;
  balance?: number;
  lockedBalance?: number;
  accountNumber: string;
  bankCode: string;
}

export interface GetCompanyCreditsParams {
  companyId: string;
  estateId?: string;
  page?: number;
  limit?: number;
  sortBy?: "amount" | "date";
  sortOrder?: "asc" | "desc";
}

export interface GetCompanyT1BreakdownParams {
  companyId: string;
  estateId?: string;
}

export interface GetCompanyT1PendingParams {
  companyId: string;
  estateId?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface CompanyWithdrawOtpPayload {
  companyId: string;
  amount: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
  narration: string;
  tx_ref: string;
}

export interface CompanyTransferPayload extends CompanyWithdrawOtpPayload {
  otp: string;
}

export interface CompanyWithdrawAuditPayload {
  walletId: string;
  type: "debit";
  amount: number;
  description: string;
  userId: string;
  role: "company";
  balanceType: "withdrawableBalance";
  isAuditOnly: true;
}

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string | string[] } } };
  const msg = err?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg ?? fallback;
}

/** POST /api/v1/wallet-mgt */
export const createCompanyWallet = createAsyncThunk(
  "company-wallet-mgt/createCompanyWallet",
  async (data: CreateCompanyWalletData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/wallet-mgt", {
        companyId: data.companyId,
        balance: data.balance ?? 0,
        lockedBalance: data.lockedBalance ?? 0,
        accountNumber: data.accountNumber,
        bankCode: data.bankCode,
      });
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Wallet creation failed"),
      });
    }
  },
);

/** GET /api/v1/wallet-mgt/company/{companyId} */
export const getCompanyWallet = createAsyncThunk(
  "company-wallet-mgt/getCompanyWallet",
  async (companyId: string, { rejectWithValue }) => {
    try {
      if (!companyId) {
        return rejectWithValue({ message: "Company ID is required to fetch wallet" });
      }
      const res = await axiosInstance.get(
        `/api/v1/wallet-mgt/company/${companyId}`,
        { params: { companyId } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch wallet"),
      });
    }
  },
);

/** GET /api/v1/wallet-mgt/company-credits/{companyId} */
export const getCompanyCredits = createAsyncThunk(
  "company-wallet-mgt/getCompanyCredits",
  async (params: GetCompanyCreditsParams, { rejectWithValue }) => {
    try {
      const { companyId, estateId, page = 1, limit = 10, sortBy, sortOrder } =
        params;
      if (!companyId) {
        return rejectWithValue({
          message: "Company ID is required to fetch company credits",
        });
      }
      const res = await axiosInstance.get(
        `/api/v1/wallet-mgt/company-credits/${companyId}`,
        {
          params: {
            companyId,
            estateId,
            page,
            limit,
            sortBy,
            sortOrder,
          },
        },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch company credits"),
      });
    }
  },
);

/** GET /api/v1/wallet-mgt/company/t1/breakdown/{companyId} */
export const getCompanyT1Breakdown = createAsyncThunk(
  "company-wallet-mgt/getCompanyT1Breakdown",
  async (params: GetCompanyT1BreakdownParams, { rejectWithValue }) => {
    try {
      const { companyId, estateId } = params;
      if (!companyId) {
        return rejectWithValue({ message: "Company ID is required" });
      }
      const res = await axiosInstance.get(
        `/api/v1/wallet-mgt/company/t1/breakdown/${companyId}`,
        { params: { companyId, estateId } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch wallet breakdown"),
      });
    }
  },
);

/** GET /api/v1/wallet-mgt/company/t1/pending/{companyId} */
export const getCompanyT1Pending = createAsyncThunk(
  "company-wallet-mgt/getCompanyT1Pending",
  async (params: GetCompanyT1PendingParams, { rejectWithValue }) => {
    try {
      const { companyId, estateId, page = 1, limit = 10, startDate, endDate } =
        params;
      if (!companyId) {
        return rejectWithValue({ message: "Company ID is required" });
      }
      const res = await axiosInstance.get(
        `/api/v1/wallet-mgt/company/t1/pending/${companyId}`,
        {
          params: { companyId, estateId, page, limit, startDate, endDate },
        },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch pending withdrawals"),
      });
    }
  },
);

/** POST /api/v1/transaction-mgt — audit-only withdrawal record */
export const createCompanyWithdrawAudit = createAsyncThunk(
  "company-wallet-mgt/createCompanyWithdrawAudit",
  async (data: CompanyWithdrawAuditPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/transaction-mgt", data);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to create withdrawal record"),
      });
    }
  },
);

/** POST /api/v1/payment-mgt/company/request-otp */
export const requestCompanyWithdrawOtp = createAsyncThunk(
  "company-wallet-mgt/requestCompanyWithdrawOtp",
  async (data: CompanyWithdrawOtpPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/payment-mgt/company/request-otp",
        data,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to request transfer OTP"),
      });
    }
  },
);

/** POST /api/v1/payment-mgt/company/transfer */
export const transferCompanyFunds = createAsyncThunk(
  "company-wallet-mgt/transferCompanyFunds",
  async (data: CompanyTransferPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/payment-mgt/company/transfer",
        data,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to transfer funds"),
      });
    }
  },
);
