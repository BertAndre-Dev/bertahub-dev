import { createSlice } from "@reduxjs/toolkit";
import { createWallet, getWallet } from "./wallet-mgt";

interface WalletData {
  id?: string;
  userId: string;
  balance: number;
  temporaryBalance: number;
  lockedBalance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface WalletResponse {
  success: boolean;
  message: string;
  data: WalletData[];
  pagination: Pagination;
}

export interface WalletState {
  createWalletState: "idle" | "isLoading" | "succeeded" | "failed";
  getWalletState: "idle" | "isLoading" | "succeeded" | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  wallet: WalletData | null;
  allWallets: WalletResponse | null;
  error: string | null;
}

const initialState: WalletState = {
  createWalletState: "idle",
  getWalletState: "idle",
  status: "idle",
  wallet: null,
  allWallets: null,
  error: null,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    resetWalletState: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder;
    // ✅ CREATE WALLET
    builder
      .addCase(createWallet.pending, (state) => {
        state.createWalletState = "isLoading";
      })
      .addCase(createWallet.fulfilled, (state, action) => {
        state.createWalletState = "succeeded";
        const newWallet = action.payload?.data;
        if (newWallet) {
          if (state.allWallets?.data) {
            state.allWallets.data.push(newWallet);
            state.allWallets.pagination.total += 1;
          } else {
            state.allWallets = {
              success: true,
              message: "wallet paid successfully",
              data: [newWallet],
              pagination: {
                total: 1,
                currentPage: 1,
                totalPages: 1,
                pageSize: 10,
              },
            };
          }
        }
      })
      .addCase(createWallet.rejected, (state, action) => {
        state.createWalletState = "failed";
        state.error = action.error.message || "Failed to create wallet";
      });

    // ✅ GET SINGLE BILL
    builder
      .addCase(getWallet.pending, (state) => {
        state.getWalletState = "isLoading";
      })
      .addCase(getWallet.fulfilled, (state, action) => {
        state.getWalletState = "succeeded";
        state.wallet = action.payload?.data || null;
      })
      .addCase(getWallet.rejected, (state, action) => {
        state.getWalletState = "failed";
        state.error = action.error.message || "Failed to fetch wallet";
      });
  },
});

export const { resetWalletState } = walletSlice.actions;
export default walletSlice.reducer;
