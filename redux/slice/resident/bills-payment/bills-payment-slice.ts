import { createSlice } from "@reduxjs/toolkit";
import {
  getBillCategories,
  getBillersByCategory,
  getBillItemsByBiller,
  validateBill,
  payBillViaWallet,
  getBillPaymentHistory,
  type BillsCategory,
  type BillsBiller,
  type BillsItem,
} from "./bills-payment";

type LoadState = "idle" | "isLoading" | "succeeded" | "failed";

export interface ResidentBillsPaymentState {
  categories: BillsCategory[];
  billers: BillsBiller[];
  items: BillsItem[];
  validation: Record<string, unknown> | null;
  payment: Record<string, unknown> | null;
  history: Record<string, unknown> | null;

  getCategoriesStatus: LoadState;
  getBillersStatus: LoadState;
  getItemsStatus: LoadState;
  validateStatus: LoadState;
  payStatus: LoadState;
  historyStatus: LoadState;

  error: string | null;
}

const initialState: ResidentBillsPaymentState = {
  categories: [],
  billers: [],
  items: [],
  validation: null,
  payment: null,
  history: null,

  getCategoriesStatus: "idle",
  getBillersStatus: "idle",
  getItemsStatus: "idle",
  validateStatus: "idle",
  payStatus: "idle",
  historyStatus: "idle",

  error: null,
};

const residentBillsPaymentSlice = createSlice({
  name: "residentBillsPayment",
  initialState,
  reducers: {
    resetBillsPaymentError(state) {
      state.error = null;
    },
    clearBillersAndItems(state) {
      state.billers = [];
      state.items = [];
    },
    clearItems(state) {
      state.items = [];
    },
    clearValidation(state) {
      state.validation = null;
      state.validateStatus = "idle";
    },
    clearPayment(state) {
      state.payment = null;
      state.payStatus = "idle";
    },
  },
  extraReducers(builder) {
    builder
      // categories
      .addCase(getBillCategories.pending, (state) => {
        state.getCategoriesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getBillCategories.fulfilled, (state, action) => {
        state.getCategoriesStatus = "succeeded";
        const data =
          action.payload?.data ??
          action.payload?.categories ??
          action.payload ??
          [];
        state.categories = Array.isArray(data) ? data : [];
      })
      .addCase(getBillCategories.rejected, (state, action) => {
        state.getCategoriesStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch bill categories.";
      })
      // billers
      .addCase(getBillersByCategory.pending, (state) => {
        state.getBillersStatus = "isLoading";
        state.error = null;
        state.billers = [];
        state.items = [];
      })
      .addCase(getBillersByCategory.fulfilled, (state, action) => {
        state.getBillersStatus = "succeeded";
        const data =
          action.payload?.data ?? action.payload?.billers ?? action.payload ?? [];
        state.billers = Array.isArray(data) ? data : [];
      })
      .addCase(getBillersByCategory.rejected, (state, action) => {
        state.getBillersStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch billers.";
      })
      // items
      .addCase(getBillItemsByBiller.pending, (state) => {
        state.getItemsStatus = "isLoading";
        state.error = null;
        state.items = [];
      })
      .addCase(getBillItemsByBiller.fulfilled, (state, action) => {
        state.getItemsStatus = "succeeded";
        const data =
          action.payload?.data ?? action.payload?.items ?? action.payload ?? [];
        state.items = Array.isArray(data) ? data : [];
      })
      .addCase(getBillItemsByBiller.rejected, (state, action) => {
        state.getItemsStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch bill items.";
      })
      // validate
      .addCase(validateBill.pending, (state) => {
        state.validateStatus = "isLoading";
        state.error = null;
        state.validation = null;
      })
      .addCase(validateBill.fulfilled, (state, action) => {
        state.validateStatus = "succeeded";
        state.validation = action.payload ?? null;
      })
      .addCase(validateBill.rejected, (state, action) => {
        state.validateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Bill validation failed.";
      })
      // pay
      .addCase(payBillViaWallet.pending, (state) => {
        state.payStatus = "isLoading";
        state.error = null;
        state.payment = null;
      })
      .addCase(payBillViaWallet.fulfilled, (state, action) => {
        state.payStatus = "succeeded";
        state.payment = action.payload ?? null;
      })
      .addCase(payBillViaWallet.rejected, (state, action) => {
        state.payStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Bill payment failed.";
      })
      // history
      .addCase(getBillPaymentHistory.pending, (state) => {
        state.historyStatus = "isLoading";
        state.error = null;
      })
      .addCase(getBillPaymentHistory.fulfilled, (state, action) => {
        state.historyStatus = "succeeded";
        state.history = action.payload ?? null;
      })
      .addCase(getBillPaymentHistory.rejected, (state, action) => {
        state.historyStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to load bill history.";
      });
  },
});

export const {
  resetBillsPaymentError,
  clearBillersAndItems,
  clearItems,
  clearValidation,
  clearPayment,
} = residentBillsPaymentSlice.actions;

export default residentBillsPaymentSlice.reducer;

