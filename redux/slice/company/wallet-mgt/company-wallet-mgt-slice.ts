import { createSlice } from "@reduxjs/toolkit";
import {
  createCompanyWallet,
  getCompanyWallet,
  getCompanyCredits,
  getCompanyT1Breakdown,
  getCompanyT1Pending,
  createCompanyWithdrawAudit,
  requestCompanyWithdrawOtp,
  transferCompanyFunds,
} from "./company-wallet-mgt";

export interface CompanyWalletData {
  id?: string;
  companyId?: string;
  balance?: number;
  temporaryBalance?: number;
  withdrawableBalance?: number;
  availableBalance?: number;
  lockedBalance?: number;
  accountNumber?: string;
  bankCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyCreditItem {
  id?: string;
  _id?: string;
  amount?: number;
  walletId?: string;
  companyId?: string;
  estateId?: string;
  description?: string;
  tx_ref?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CompanyCreditsResponse {
  success?: boolean;
  data?: CompanyCreditItem[];
  summary?: Record<string, unknown>;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  };
}

export interface CompanyWalletState {
  createWalletState: "idle" | "isLoading" | "succeeded" | "failed";
  getWalletState: "idle" | "isLoading" | "succeeded" | "failed";
  getCompanyCreditsState: "idle" | "isLoading" | "succeeded" | "failed";
  getT1BreakdownState: "idle" | "isLoading" | "succeeded" | "failed";
  getT1PendingState: "idle" | "isLoading" | "succeeded" | "failed";
  requestOtpState: "idle" | "isLoading" | "succeeded" | "failed";
  transferFundsState: "idle" | "isLoading" | "succeeded" | "failed";
  wallet: CompanyWalletData | null;
  companyCredits: CompanyCreditsResponse | null;
  t1Breakdown: Record<string, unknown> | null;
  t1Pending: { data?: unknown[]; pagination?: Record<string, number> } | null;
  error: string | null;
}

const initialState: CompanyWalletState = {
  createWalletState: "idle",
  getWalletState: "idle",
  getCompanyCreditsState: "idle",
  getT1BreakdownState: "idle",
  getT1PendingState: "idle",
  requestOtpState: "idle",
  transferFundsState: "idle",
  wallet: null,
  companyCredits: null,
  t1Breakdown: null,
  t1Pending: null,
  error: null,
};

const companyWalletSlice = createSlice({
  name: "companyWallet",
  initialState,
  reducers: {
    resetCompanyWalletState: (state) => {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(createCompanyWallet.pending, (state) => {
        state.createWalletState = "isLoading";
      })
      .addCase(createCompanyWallet.fulfilled, (state, action) => {
        state.createWalletState = "succeeded";
        const newWallet = action.payload?.data;
        if (newWallet) state.wallet = newWallet;
      })
      .addCase(createCompanyWallet.rejected, (state, action) => {
        state.createWalletState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to create wallet";
      })

      .addCase(getCompanyWallet.pending, (state) => {
        state.getWalletState = "isLoading";
      })
      .addCase(getCompanyWallet.fulfilled, (state, action) => {
        state.getWalletState = "succeeded";
        state.wallet = action.payload?.data ?? null;
      })
      .addCase(getCompanyWallet.rejected, (state, action) => {
        state.getWalletState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch wallet";
      })

      .addCase(getCompanyCredits.pending, (state) => {
        state.getCompanyCreditsState = "isLoading";
      })
      .addCase(getCompanyCredits.fulfilled, (state, action) => {
        state.getCompanyCreditsState = "succeeded";
        const rawCredits: CompanyCreditItem[] = action.payload?.data ?? [];
        state.companyCredits = {
          success: action.payload?.success,
          data: rawCredits.map((item) => ({
            ...item,
            id: item.id ?? item._id,
          })),
          summary: action.payload?.summary,
          pagination: action.payload?.pagination,
        };
      })
      .addCase(getCompanyCredits.rejected, (state, action) => {
        state.getCompanyCreditsState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch company credits";
      })

      .addCase(getCompanyT1Breakdown.pending, (state) => {
        state.getT1BreakdownState = "isLoading";
      })
      .addCase(getCompanyT1Breakdown.fulfilled, (state, action) => {
        state.getT1BreakdownState = "succeeded";
        state.t1Breakdown = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(getCompanyT1Breakdown.rejected, (state, action) => {
        state.getT1BreakdownState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          null;
      })

      .addCase(getCompanyT1Pending.pending, (state) => {
        state.getT1PendingState = "isLoading";
      })
      .addCase(getCompanyT1Pending.fulfilled, (state, action) => {
        state.getT1PendingState = "succeeded";
        state.t1Pending = {
          data: action.payload?.data ?? [],
          pagination: action.payload?.pagination ?? null,
        };
      })
      .addCase(getCompanyT1Pending.rejected, (state, action) => {
        state.getT1PendingState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          null;
      })

      .addCase(requestCompanyWithdrawOtp.pending, (state) => {
        state.requestOtpState = "isLoading";
      })
      .addCase(requestCompanyWithdrawOtp.fulfilled, (state) => {
        state.requestOtpState = "succeeded";
      })
      .addCase(requestCompanyWithdrawOtp.rejected, (state, action) => {
        state.requestOtpState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          null;
      })

      .addCase(transferCompanyFunds.pending, (state) => {
        state.transferFundsState = "isLoading";
      })
      .addCase(transferCompanyFunds.fulfilled, (state) => {
        state.transferFundsState = "succeeded";
      })
      .addCase(transferCompanyFunds.rejected, (state, action) => {
        state.transferFundsState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          null;
      })

      .addCase(createCompanyWithdrawAudit.rejected, (state, action) => {
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          null;
      });
  },
});

export const { resetCompanyWalletState } = companyWalletSlice.actions;
export default companyWalletSlice.reducer;

export const selectCompanyWallet = (state: { companyWallet: CompanyWalletState }) =>
  state.companyWallet.wallet;

export const selectCompanyCredits = (state: {
  companyWallet: CompanyWalletState;
}) => state.companyWallet.companyCredits?.data ?? [];

export const selectCompanyCreditsLoading = (state: {
  companyWallet: CompanyWalletState;
}) => state.companyWallet.getCompanyCreditsState === "isLoading";

export const selectCompanyCreditsPagination = (state: {
  companyWallet: CompanyWalletState;
}) => state.companyWallet.companyCredits?.pagination ?? null;
