import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  cancelStaffRequest,
  createStaffRequest,
  decideStaffRequest,
  getStaffRequestCategories,
  getStaffRequests,
  type StaffRequestCategory,
  type StaffRequestItem,
  type StaffRequestStatus,
} from "./staff-request";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface StaffRequestUiState {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: StaffRequestStatus | "";
}

interface StaffRequestState {
  list: StaffRequestItem[];
  categories: StaffRequestCategory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  } | null;
  ui: StaffRequestUiState;
  getListStatus: AsyncStatus;
  getCategoriesStatus: AsyncStatus;
  createStatus: AsyncStatus;
  decideStatus: AsyncStatus;
  cancelStatus: AsyncStatus;
  error: string | null;
}

const initialState: StaffRequestState = {
  list: [],
  categories: [],
  pagination: null,
  ui: {
    page: 1,
    pageSize: 10,
    search: "",
    statusFilter: "",
  },
  getListStatus: "idle",
  getCategoriesStatus: "idle",
  createStatus: "idle",
  decideStatus: "idle",
  cancelStatus: "idle",
  error: null,
};

function upsertListItem(list: StaffRequestItem[], item: StaffRequestItem) {
  const index = list.findIndex((row) => row.id === item.id);
  if (index === -1) return list;
  const next = [...list];
  next[index] = { ...next[index], ...item };
  return next;
}

const staffRequestSlice = createSlice({
  name: "staffRequest",
  initialState,
  reducers: {
    setStaffRequestSearch: (state, action: PayloadAction<string>) => {
      state.ui.search = action.payload;
      state.ui.page = 1;
    },
    setStaffRequestStatusFilter: (
      state,
      action: PayloadAction<StaffRequestStatus | "">,
    ) => {
      state.ui.statusFilter = action.payload;
      state.ui.page = 1;
    },
    setStaffRequestPage: (state, action: PayloadAction<number>) => {
      state.ui.page = action.payload;
    },
    setStaffRequestPageSize: (state, action: PayloadAction<number>) => {
      state.ui.pageSize = action.payload;
      state.ui.page = 1;
    },
    clearStaffRequestError: (state) => {
      state.error = null;
    },
    resetStaffRequestCreateStatus: (state) => {
      state.createStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStaffRequests.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getStaffRequests.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        state.list = action.payload.list;
        state.pagination = action.payload.pagination;
      })
      .addCase(getStaffRequests.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = [];
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch requests";
      })
      .addCase(getStaffRequestCategories.pending, (state) => {
        state.getCategoriesStatus = "isLoading";
      })
      .addCase(getStaffRequestCategories.fulfilled, (state, action) => {
        state.getCategoriesStatus = "succeeded";
        state.categories = action.payload;
      })
      .addCase(getStaffRequestCategories.rejected, (state, action) => {
        state.getCategoriesStatus = "failed";
        state.categories = [];
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch request categories";
      })
      .addCase(createStaffRequest.pending, (state) => {
        state.createStatus = "isLoading";
        state.error = null;
      })
      .addCase(createStaffRequest.fulfilled, (state) => {
        state.createStatus = "succeeded";
      })
      .addCase(createStaffRequest.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to create request";
      })
      .addCase(decideStaffRequest.pending, (state) => {
        state.decideStatus = "isLoading";
        state.error = null;
      })
      .addCase(decideStaffRequest.fulfilled, (state, action) => {
        state.decideStatus = "succeeded";
        if (action.payload.item) {
          state.list = upsertListItem(state.list, action.payload.item);
        }
      })
      .addCase(decideStaffRequest.rejected, (state, action) => {
        state.decideStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to submit decision";
      })
      .addCase(cancelStaffRequest.pending, (state) => {
        state.cancelStatus = "isLoading";
        state.error = null;
      })
      .addCase(cancelStaffRequest.fulfilled, (state, action) => {
        state.cancelStatus = "succeeded";
        if (action.payload.item) {
          state.list = upsertListItem(state.list, action.payload.item);
        } else {
          const existing = state.list.find((row) => row.id === action.payload.id);
          if (existing) {
            state.list = upsertListItem(state.list, {
              ...existing,
              status: "cancelled",
            });
          }
        }
      })
      .addCase(cancelStaffRequest.rejected, (state, action) => {
        state.cancelStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to cancel request";
      });
  },
});

export const {
  setStaffRequestSearch,
  setStaffRequestStatusFilter,
  setStaffRequestPage,
  setStaffRequestPageSize,
  clearStaffRequestError,
  resetStaffRequestCreateStatus,
} = staffRequestSlice.actions;

export default staffRequestSlice.reducer;
