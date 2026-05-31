import { createSlice } from "@reduxjs/toolkit";
import {
  createCompanyExpenseEntries,
  deleteCompanyExpenseEntry,
  fetchCompanyExpenseEntries,
  fetchCompanyExpenseEntryById,
  updateCompanyExpenseEntry,
  type CompanyExpenseEntry,
} from "./company-expense-entry";
import type { RootState } from "@/redux/store";

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyExpenseEntryPagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface CompanyExpenseEntryState {
  createBulkState: AsyncState;
  listState: AsyncState;
  getByIdState: AsyncState;
  updateState: AsyncState;
  deleteState: AsyncState;
  items: CompanyExpenseEntry[];
  selected: CompanyExpenseEntry | null;
  pagination: CompanyExpenseEntryPagination | null;
  error: string | null;
}

const initialState: CompanyExpenseEntryState = {
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

function getId(item: CompanyExpenseEntry | null | undefined): string | undefined {
  return item?.id ?? item?._id;
}

const companyExpenseEntrySlice = createSlice({
  name: "companyExpenseEntry",
  initialState,
  reducers: {
    resetCompanyExpenseEntryError: (state) => {
      state.error = null;
    },
    clearCompanyExpenseEntries: (state) => {
      state.items = [];
      state.pagination = null;
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCompanyExpenseEntries.pending, (state) => {
        state.createBulkState = "isLoading";
        state.error = null;
      })
      .addCase(createCompanyExpenseEntries.fulfilled, (state, action) => {
        state.createBulkState = "succeeded";
        const created: CompanyExpenseEntry[] =
          action.payload?.data ?? action.payload ?? [];
        if (Array.isArray(created) && created.length) {
          state.items = [...created, ...(state.items ?? [])];
          if (state.pagination) state.pagination.total += created.length;
        }
      })
      .addCase(createCompanyExpenseEntries.rejected, (state, action) => {
        state.createBulkState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to create expense entries.";
      });

    builder
      .addCase(fetchCompanyExpenseEntries.pending, (state) => {
        state.listState = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyExpenseEntries.fulfilled, (state, action) => {
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
      .addCase(fetchCompanyExpenseEntries.rejected, (state, action) => {
        state.listState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch expense entries.";
      });

    builder
      .addCase(fetchCompanyExpenseEntryById.pending, (state) => {
        state.getByIdState = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyExpenseEntryById.fulfilled, (state, action) => {
        state.getByIdState = "succeeded";
        state.selected = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchCompanyExpenseEntryById.rejected, (state, action) => {
        state.getByIdState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch expense entry.";
      });

    builder
      .addCase(updateCompanyExpenseEntry.pending, (state) => {
        state.updateState = "isLoading";
        state.error = null;
      })
      .addCase(updateCompanyExpenseEntry.fulfilled, (state, action) => {
        state.updateState = "succeeded";
        const updated: CompanyExpenseEntry | undefined =
          action.payload?.data ?? action.payload;
        const updatedId = getId(updated);
        if (!updatedId) return;
        state.items = (state.items ?? []).map((it) =>
          getId(it) === updatedId ? { ...it, ...updated } : it,
        );
      })
      .addCase(updateCompanyExpenseEntry.rejected, (state, action) => {
        state.updateState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to update expense entry.";
      });

    builder
      .addCase(deleteCompanyExpenseEntry.pending, (state) => {
        state.deleteState = "isLoading";
        state.error = null;
      })
      .addCase(deleteCompanyExpenseEntry.fulfilled, (state, action) => {
        state.deleteState = "succeeded";
        const deletedId: string | undefined = action.payload?.id;
        if (!deletedId) return;
        state.items = (state.items ?? []).filter((it) => getId(it) !== deletedId);
        if (state.pagination)
          state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteCompanyExpenseEntry.rejected, (state, action) => {
        state.deleteState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to delete expense entry.";
      });
  },
});

export const { resetCompanyExpenseEntryError, clearCompanyExpenseEntries } =
  companyExpenseEntrySlice.actions;
export default companyExpenseEntrySlice.reducer;

export const selectCompanyExpenseEntries = (state: RootState) =>
  (state.companyExpenseEntry as CompanyExpenseEntryState)?.items ?? [];
export const selectCompanyExpenseEntriesLoading = (state: RootState) =>
  (state.companyExpenseEntry as CompanyExpenseEntryState)?.listState ===
  "isLoading";
export const selectCompanyExpenseEntriesError = (state: RootState) =>
  (state.companyExpenseEntry as CompanyExpenseEntryState)?.error ?? null;
export const selectCompanyExpenseEntriesPagination = (state: RootState) =>
  (state.companyExpenseEntry as CompanyExpenseEntryState)?.pagination ?? null;
export const selectCompanyExpenseEntrySelected = (state: RootState) =>
  (state.companyExpenseEntry as CompanyExpenseEntryState)?.selected ?? null;
