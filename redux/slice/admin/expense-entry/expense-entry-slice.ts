import { createSlice } from "@reduxjs/toolkit";
import {
  createExpenseEntries,
  deleteExpenseEntry,
  fetchExpenseEntries,
  fetchExpenseEntryById,
  updateExpenseEntry,
  type ExpenseEntry,
} from "./expense-entry";
import type { RootState } from "@/redux/store";

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface ExpenseEntryPagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface ExpenseEntryState {
  createBulkState: AsyncState;
  listState: AsyncState;
  getByIdState: AsyncState;
  updateState: AsyncState;
  deleteState: AsyncState;
  items: ExpenseEntry[];
  selected: ExpenseEntry | null;
  pagination: ExpenseEntryPagination | null;
  error: string | null;
}

const initialState: ExpenseEntryState = {
  createBulkState: "idle",
  listState: "idle",
  getByIdState: "idle",
  updateState: "idle",
  deleteState: "idle",
  items: [],
  selected: null,
  pagination: null,
  error: null,
};

function getId(item: ExpenseEntry | null | undefined): string | undefined {
  return item?.id ?? item?._id;
}

const expenseEntrySlice = createSlice({
  name: "adminExpenseEntry",
  initialState,
  reducers: {
    resetExpenseEntryError: (state) => {
      state.error = null;
    },
    clearExpenseEntries: (state) => {
      state.items = [];
      state.pagination = null;
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createExpenseEntries.pending, (state) => {
        state.createBulkState = "isLoading";
        state.error = null;
      })
      .addCase(createExpenseEntries.fulfilled, (state, action: any) => {
        state.createBulkState = "succeeded";
        const created: ExpenseEntry[] =
          action.payload?.data ?? action.payload ?? [];
        if (Array.isArray(created) && created.length) {
          state.items = [...created, ...(state.items ?? [])];
          if (state.pagination) state.pagination.total += created.length;
        }
      })
      .addCase(createExpenseEntries.rejected, (state, action: any) => {
        state.createBulkState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to create expense entries.";
      });

    builder
      .addCase(fetchExpenseEntries.pending, (state) => {
        state.listState = "isLoading";
        state.error = null;
      })
      .addCase(fetchExpenseEntries.fulfilled, (state, action: any) => {
        state.listState = "succeeded";
        const apiPagination = action.payload?.pagination || {};
        state.items = action.payload?.data || [];
        state.pagination = {
          total: apiPagination.total ?? state.items.length ?? 0,
          currentPage: apiPagination.page ?? 1,
          totalPages: apiPagination.pages ?? 1,
          pageSize: apiPagination.limit ?? 10,
        };
      })
      .addCase(fetchExpenseEntries.rejected, (state, action: any) => {
        state.listState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to fetch expense entries.";
      });

    builder
      .addCase(fetchExpenseEntryById.pending, (state) => {
        state.getByIdState = "isLoading";
        state.error = null;
      })
      .addCase(fetchExpenseEntryById.fulfilled, (state, action: any) => {
        state.getByIdState = "succeeded";
        state.selected = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchExpenseEntryById.rejected, (state, action: any) => {
        state.getByIdState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to fetch expense entry.";
      });

    builder
      .addCase(updateExpenseEntry.pending, (state) => {
        state.updateState = "isLoading";
        state.error = null;
      })
      .addCase(updateExpenseEntry.fulfilled, (state, action: any) => {
        state.updateState = "succeeded";
        const updated: ExpenseEntry | undefined =
          action.payload?.data ?? action.payload;
        const updatedId = getId(updated);
        if (!updatedId) return;
        state.items = (state.items ?? []).map((it) =>
          getId(it) === updatedId ? { ...it, ...updated } : it,
        );
      })
      .addCase(updateExpenseEntry.rejected, (state, action: any) => {
        state.updateState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to update expense entry.";
      });

    builder
      .addCase(deleteExpenseEntry.pending, (state) => {
        state.deleteState = "isLoading";
        state.error = null;
      })
      .addCase(deleteExpenseEntry.fulfilled, (state, action: any) => {
        state.deleteState = "succeeded";
        const deletedId: string | undefined = action.payload?.id;
        if (!deletedId) return;
        state.items = (state.items ?? []).filter((it) => getId(it) !== deletedId);
        if (state.pagination)
          state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteExpenseEntry.rejected, (state, action: any) => {
        state.deleteState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to delete expense entry.";
      });
  },
});

export const { resetExpenseEntryError, clearExpenseEntries } =
  expenseEntrySlice.actions;
export default expenseEntrySlice.reducer;

export const selectExpenseEntries = (state: RootState) =>
  (state.adminExpenseEntry as ExpenseEntryState)?.items ?? [];
export const selectExpenseEntriesLoading = (state: RootState) =>
  (state.adminExpenseEntry as ExpenseEntryState)?.listState === "isLoading";
export const selectExpenseEntriesError = (state: RootState) =>
  (state.adminExpenseEntry as ExpenseEntryState)?.error ?? null;
export const selectExpenseEntriesPagination = (state: RootState) =>
  (state.adminExpenseEntry as ExpenseEntryState)?.pagination ?? null;
export const selectExpenseEntrySelected = (state: RootState) =>
  (state.adminExpenseEntry as ExpenseEntryState)?.selected ?? null;


