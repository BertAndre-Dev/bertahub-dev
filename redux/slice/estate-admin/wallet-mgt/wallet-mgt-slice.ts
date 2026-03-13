import { createSlice } from "@reduxjs/toolkit";
import { createWallet, getWallet, getEstateCredits } from "./wallet-mgt";

interface WalletData {
  id?: string;
  estateId: string;
  balance: number;
  temporaryBalance: number;
  lockedBalance: number;
  accountNumber?: string;
  bankCode?: string;
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

export interface EstateCreditItem {
  id?: string;
  _id?: string;
  amount?: number;
  walletId?: string;
  estateId?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface EstateCreditsResponse {
  success?: boolean;
  data?: EstateCreditItem[];
  summary?: Record<string, unknown>;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  };
}

export interface WalletState {
  createWalletState: "idle" | "isLoading" | "succeeded" | "failed";
  getWalletState: "idle" | "isLoading" | "succeeded" | "failed";
  getEstateCreditsState: "idle" | "isLoading" | "succeeded" | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  wallet: WalletData | null;
  allWallets: WalletResponse | null;
  estateCredits: EstateCreditsResponse | null;
  error: string | null;
}

const initialState: WalletState = {
  createWalletState: "idle",
  getWalletState: "idle",
  getEstateCreditsState: "idle",
  status: "idle",
  wallet: null,
  allWallets: null,
  estateCredits: null,
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

    // GET ESTATE CREDITS
    builder
      .addCase(getEstateCredits.pending, (state) => {
        state.getEstateCreditsState = "isLoading";
      })
      .addCase(getEstateCredits.fulfilled, (state, action) => {
        state.getEstateCreditsState = "succeeded";
        const rawCredits: EstateCreditItem[] = action.payload?.data ?? [];
        const normalizedCredits = rawCredits.map((item) => ({
          ...item,
          // Backend typically returns `_id`; Table keys prefer `id`.
          id: (item as any)?.id ?? (item as any)?._id,
        }));
        state.estateCredits = {
          success: action.payload?.success,
          data: normalizedCredits,
          summary: action.payload?.summary,
          pagination: action.payload?.pagination,
        };
      })
      .addCase(getEstateCredits.rejected, (state, action) => {
        state.getEstateCreditsState = "failed";
        state.error = action.error.message || "Failed to fetch estate credits";
      });
  },
});

export const { resetWalletState } = walletSlice.actions;
export default walletSlice.reducer;
