import { createSlice } from "@reduxjs/toolkit";
import {
  createExpenseHead,
  deleteExpenseHead,
  fetchExpenseHeads,
  fetchExpenseHeadById,
  updateExpenseHead,
  type ExpenseHead,
} from "./expense-head";
import type { RootState } from "@/redux/store";

export interface ExpenseHeadPagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface ExpenseHeadState {
  createState: AsyncState;
  listState: AsyncState;
  getByIdState: AsyncState;
  updateState: AsyncState;
  deleteState: AsyncState;
  items: ExpenseHead[];
  selected: ExpenseHead | null;
  pagination: ExpenseHeadPagination | null;
  error: string | null;
}

const initialState: ExpenseHeadState = {
  createState: "idle",
  listState: "idle",
  getByIdState: "idle",
  updateState: "idle",
  deleteState: "idle",
  items: [],
  selected: null,
  pagination: null,
  error: null,
};

function getId(item: ExpenseHead | null | undefined): string | undefined {
  return item?.id ?? item?._id;
}

const expenseHeadSlice = createSlice({
  name: "adminExpenseHead",
  initialState,
  reducers: {
    resetExpenseHeadError: (state) => {
      state.error = null;
    },
    clearSelectedExpenseHead: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createExpenseHead.pending, (state) => {
        state.createState = "isLoading";
        state.error = null;
      })
      .addCase(createExpenseHead.fulfilled, (state, action) => {
        state.createState = "succeeded";
        const created: ExpenseHead | undefined =
          action.payload?.data ?? action.payload;
        if (created) {
          state.items = [created, ...(state.items ?? [])];
          if (state.pagination) state.pagination.total += 1;
        }
      })
      .addCase(createExpenseHead.rejected, (state, action: any) => {
        state.createState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to create expense head.";
      });

    builder
      .addCase(fetchExpenseHeads.pending, (state) => {
        state.listState = "isLoading";
        state.error = null;
      })
      .addCase(fetchExpenseHeads.fulfilled, (state, action: any) => {
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
      .addCase(fetchExpenseHeads.rejected, (state, action: any) => {
        state.listState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to fetch expense heads.";
      });

    builder
      .addCase(fetchExpenseHeadById.pending, (state) => {
        state.getByIdState = "isLoading";
        state.error = null;
      })
      .addCase(fetchExpenseHeadById.fulfilled, (state, action: any) => {
        state.getByIdState = "succeeded";
        state.selected = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchExpenseHeadById.rejected, (state, action: any) => {
        state.getByIdState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to fetch expense head.";
      });

    builder
      .addCase(updateExpenseHead.pending, (state) => {
        state.updateState = "isLoading";
        state.error = null;
      })
      .addCase(updateExpenseHead.fulfilled, (state, action: any) => {
        state.updateState = "succeeded";
        const updated: ExpenseHead | undefined =
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
      .addCase(updateExpenseHead.rejected, (state, action: any) => {
        state.updateState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to update expense head.";
      });

    builder
      .addCase(deleteExpenseHead.pending, (state) => {
        state.deleteState = "isLoading";
        state.error = null;
      })
      .addCase(deleteExpenseHead.fulfilled, (state, action: any) => {
        state.deleteState = "succeeded";
        const deletedId: string | undefined = action.payload?.id;
        if (!deletedId) return;
        state.items = (state.items ?? []).filter((it) => getId(it) !== deletedId);
        if (state.pagination)
          state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteExpenseHead.rejected, (state, action: any) => {
        state.deleteState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to delete expense head.";
      });
  },
});

export const { resetExpenseHeadError, clearSelectedExpenseHead } =
  expenseHeadSlice.actions;
export default expenseHeadSlice.reducer;

export const selectExpenseHeads = (state: RootState) =>
  (state.adminExpenseHead as ExpenseHeadState)?.items ?? [];
export const selectExpenseHeadsLoading = (state: RootState) =>
  (state.adminExpenseHead as ExpenseHeadState)?.listState === "isLoading";
export const selectExpenseHeadsError = (state: RootState) =>
  (state.adminExpenseHead as ExpenseHeadState)?.error ?? null;
export const selectExpenseHeadsPagination = (state: RootState) =>
  (state.adminExpenseHead as ExpenseHeadState)?.pagination ?? null;

