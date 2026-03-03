import { createSlice } from "@reduxjs/toolkit";
import { getBanks, verifyBankAccount } from "./payment-mgt";
import type { BankItem } from "./payment-mgt";

export interface ResidentPaymentMgtState {
  getBanksState: "idle" | "isLoading" | "succeeded" | "failed";
  verifyBankAccountState: "idle" | "isLoading" | "succeeded" | "failed";
  banks: BankItem[];
  verifiedAccountName: string | null;
  error: string | null;
}

const initialState: ResidentPaymentMgtState = {
  getBanksState: "idle",
  verifyBankAccountState: "idle",
  banks: [],
  verifiedAccountName: null,
  error: null,
};

const residentPaymentMgtSlice = createSlice({
  name: "residentPaymentMgt",
  initialState,
  reducers: {
    clearResidentBanks: (state) => {
      state.banks = [];
      state.getBanksState = "idle";
    },
    clearResidentVerifiedAccount: (state) => {
      state.verifiedAccountName = null;
      state.verifyBankAccountState = "idle";
    },
    resetResidentPaymentMgt: (state) => {
      state.getBanksState = "idle";
      state.verifyBankAccountState = "idle";
      state.banks = [];
      state.verifiedAccountName = null;
      state.error = null;
    },
  },
  extraReducers(builder) {
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
      })
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
  clearResidentBanks,
  clearResidentVerifiedAccount,
  resetResidentPaymentMgt,
} = residentPaymentMgtSlice.actions;
export default residentPaymentMgtSlice.reducer;
