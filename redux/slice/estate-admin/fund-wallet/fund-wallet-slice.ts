import { createSlice } from "@reduxjs/toolkit";
import { getBanks, verifyBankAccount } from "./fund-wallet";
import type { BankItem } from "./fund-wallet";

export interface FundWalletState {
  getBanksState: "idle" | "isLoading" | "succeeded" | "failed";
  verifyBankAccountState: "idle" | "isLoading" | "succeeded" | "failed";
  banks: BankItem[];
  verifiedAccountName: string | null;
  error: string | null;
}

const initialState: FundWalletState = {
  getBanksState: "idle",
  verifyBankAccountState: "idle",
  banks: [],
  verifiedAccountName: null,
  error: null,
};

const fundWalletSlice = createSlice({
  name: "estateAdminFundWallet",
  initialState,
  reducers: {
    resetFundWalletState: (state) => {
      state.getBanksState = "idle";
      state.verifyBankAccountState = "idle";
      state.error = null;
      state.verifiedAccountName = null;
    },
    clearVerifiedAccount: (state) => {
      state.verifiedAccountName = null;
      state.verifyBankAccountState = "idle";
    },
    clearBanks: (state) => {
      state.banks = [];
      state.getBanksState = "idle";
    },
  },
  extraReducers(builder) {
    // getBanks
    builder
      .addCase(getBanks.pending, (state) => {
        state.getBanksState = "isLoading";
        state.error = null;
      })
      .addCase(getBanks.fulfilled, (state, action) => {
        state.getBanksState = "succeeded";
        state.banks = action.payload ?? [];
      })
      .addCase(getBanks.rejected, (state, action) => {
        state.getBanksState = "failed";
        state.banks = [];
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to load banks";
      });

    // verifyBankAccount
    builder
      .addCase(verifyBankAccount.pending, (state) => {
        state.verifyBankAccountState = "isLoading";
        state.verifiedAccountName = null;
        state.error = null;
      })
      .addCase(verifyBankAccount.fulfilled, (state, action) => {
        state.verifyBankAccountState = "succeeded";
        state.verifiedAccountName = action.payload?.accountName ?? null;
      })
      .addCase(verifyBankAccount.rejected, (state, action) => {
        state.verifyBankAccountState = "failed";
        state.verifiedAccountName = null;
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Account not found";
      });
  },
});

export const {
  resetFundWalletState,
  clearVerifiedAccount,
  clearBanks,
} = fundWalletSlice.actions;
export default fundWalletSlice.reducer;
