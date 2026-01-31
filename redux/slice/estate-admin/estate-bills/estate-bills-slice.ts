import { createSlice } from "@reduxjs/toolkit";
import { getEstateBills } from "./estate-bills";

export interface EstateBillUser {
  firstName: string;
  lastName: string;
  email: string;
}

export interface EstateBillBill {
  name: string;
}

export interface EstateBillItem {
  _id: string;
  id?: string; // optional for Table component row type compatibility
  frequency: string;
  amountPaid: number;
  startDate: string;
  nextDueDate: string;
  status: string;
  createdAt: string;
  user: EstateBillUser;
  bill: EstateBillBill;
}

export interface EstateBillsTotals {
  totalRecords: number;
  totalAmountPaid: number;
}

export interface EstateBillsPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface EstateBillsResponse {
  success: boolean;
  message: string;
  data: EstateBillItem[];
  totals: EstateBillsTotals;
  pagination: EstateBillsPagination;
}

export interface EstateBillsState {
  getEstateBillsState: "idle" | "isLoading" | "succeeded" | "failed";
  estateBills: EstateBillsResponse | null;
  error: string | null;
}

const initialState: EstateBillsState = {
  getEstateBillsState: "idle",
  estateBills: null,
  error: null,
};

const estateBillsSlice = createSlice({
  name: "estateAdminEstateBills",
  initialState,
  reducers: {
    resetEstateBillsState: (state) => {
      state.getEstateBillsState = "idle";
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getEstateBills.pending, (state) => {
        state.getEstateBillsState = "isLoading";
        state.error = null;
      })
      .addCase(getEstateBills.fulfilled, (state, action) => {
        state.getEstateBillsState = "succeeded";
        state.estateBills = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ?? "Estate resident bills retrieved successfully.",
          data: action.payload?.data ?? [],
          totals: action.payload?.totals ?? {
            totalRecords: 0,
            totalAmountPaid: 0,
          },
          pagination: action.payload?.pagination ?? {
            total: 0,
            page: 1,
            limit: 10,
            pages: 0,
          },
        };
      })
      .addCase(getEstateBills.rejected, (state, action) => {
        state.getEstateBillsState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch estate bills";
      });
  },
});

export const { resetEstateBillsState } = estateBillsSlice.actions;
export default estateBillsSlice.reducer;
