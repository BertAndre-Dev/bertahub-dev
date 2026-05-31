import { createSlice } from "@reduxjs/toolkit";
import {
  createCompanyExpenseHead,
  deleteCompanyExpenseHead,
  fetchCompanyExpenseHeads,
  fetchCompanyExpenseHeadById,
  updateCompanyExpenseHead,
  type CompanyExpenseHead,
} from "./company-expense-head";
import type { RootState } from "@/redux/store";

export interface CompanyExpenseHeadPagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyExpenseHeadState {
  createState: AsyncState;
  listState: AsyncState;
  getByIdState: AsyncState;
  updateState: AsyncState;
  deleteState: AsyncState;
  items: CompanyExpenseHead[];
  selected: CompanyExpenseHead | null;
  pagination: CompanyExpenseHeadPagination | null;
  selectedEstateId: string | null;
  error: string | null;
}

const initialState: CompanyExpenseHeadState = {
  createState: "idle",
  listState: "idle",
  getByIdState: "idle",
  updateState: "idle",
  deleteState: "idle",
  items: [],
  selected: null,
  pagination: null,
  selectedEstateId: null,
  error: null,
};

function getId(item: CompanyExpenseHead | null | undefined): string | undefined {
  return item?.id ?? item?._id;
}

const companyExpenseHeadSlice = createSlice({
  name: "companyExpenseHead",
  initialState,
  reducers: {
    resetCompanyExpenseHeadError: (state) => {
      state.error = null;
    },
    clearSelectedCompanyExpenseHead: (state) => {
      state.selected = null;
    },
    setCompanyExpenseHeadEstate: (state, action: { payload: string | null }) => {
      state.selectedEstateId = action.payload;
      state.items = [];
      state.pagination = null;
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCompanyExpenseHead.pending, (state) => {
        state.createState = "isLoading";
        state.error = null;
      })
      .addCase(createCompanyExpenseHead.fulfilled, (state, action) => {
        state.createState = "succeeded";
        const created: CompanyExpenseHead | undefined =
          action.payload?.data ?? action.payload;
        if (created) {
          state.items = [created, ...(state.items ?? [])];
          if (state.pagination) state.pagination.total += 1;
        }
      })
      .addCase(createCompanyExpenseHead.rejected, (state, action) => {
        state.createState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to create expense head.";
      });

    builder
      .addCase(fetchCompanyExpenseHeads.pending, (state) => {
        state.listState = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyExpenseHeads.fulfilled, (state, action) => {
        state.listState = "succeeded";
        const apiPagination = action.payload?.pagination || {};
        state.items = action.payload?.data || [];
        state.pagination = {
          total: apiPagination.total ?? state.items.length ?? 0,
          currentPage: apiPagination.page ?? 1,
          totalPages: apiPagination.pages ?? 1,
          pageSize: apiPagination.limit ?? 12,
        };
      })
      .addCase(fetchCompanyExpenseHeads.rejected, (state, action) => {
        state.listState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch expense heads.";
      });

    builder
      .addCase(fetchCompanyExpenseHeadById.pending, (state) => {
        state.getByIdState = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyExpenseHeadById.fulfilled, (state, action) => {
        state.getByIdState = "succeeded";
        state.selected = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchCompanyExpenseHeadById.rejected, (state, action) => {
        state.getByIdState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch expense head.";
      });

    builder
      .addCase(updateCompanyExpenseHead.pending, (state) => {
        state.updateState = "isLoading";
        state.error = null;
      })
      .addCase(updateCompanyExpenseHead.fulfilled, (state, action) => {
        state.updateState = "succeeded";
        const updated: CompanyExpenseHead | undefined =
          action.payload?.data ?? action.payload;
        const updatedId = getId(updated);
        if (!updatedId) return;
        state.items = (state.items ?? []).map((it) =>
          getId(it) === updatedId ? { ...it, ...updated } : it,
        );
        if (state.selected && getId(state.selected) === updatedId) {
          state.selected = { ...state.selected, ...updated };
        }
      })
      .addCase(updateCompanyExpenseHead.rejected, (state, action) => {
        state.updateState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to update expense head.";
      });

    builder
      .addCase(deleteCompanyExpenseHead.pending, (state) => {
        state.deleteState = "isLoading";
        state.error = null;
      })
      .addCase(deleteCompanyExpenseHead.fulfilled, (state, action) => {
        state.deleteState = "succeeded";
        const deletedId: string | undefined = action.payload?.id;
        if (!deletedId) return;
        state.items = (state.items ?? []).filter((it) => getId(it) !== deletedId);
        if (state.pagination)
          state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteCompanyExpenseHead.rejected, (state, action) => {
        state.deleteState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to delete expense head.";
      });
  },
});

export const {
  resetCompanyExpenseHeadError,
  clearSelectedCompanyExpenseHead,
  setCompanyExpenseHeadEstate,
} = companyExpenseHeadSlice.actions;
export default companyExpenseHeadSlice.reducer;

export const selectCompanyExpenseHeads = (state: RootState) =>
  (state.companyExpenseHead as CompanyExpenseHeadState)?.items ?? [];
export const selectCompanyExpenseHeadsLoading = (state: RootState) =>
  (state.companyExpenseHead as CompanyExpenseHeadState)?.listState ===
  "isLoading";
export const selectCompanyExpenseHeadsError = (state: RootState) =>
  (state.companyExpenseHead as CompanyExpenseHeadState)?.error ?? null;
export const selectCompanyExpenseHeadsPagination = (state: RootState) =>
  (state.companyExpenseHead as CompanyExpenseHeadState)?.pagination ?? null;
