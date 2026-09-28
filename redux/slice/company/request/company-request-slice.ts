import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  cancelCompanyRequest,
  decideCompanyRequest,
  deleteCompanyRequest,
  getCompanyRequestById,
  getCompanyRequests,
  type CompanyRequestItem,
  type CompanyRequestStatus,
} from "./company-request";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyRequestUiState {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: CompanyRequestStatus | "";
}

interface CompanyRequestState {
  list: CompanyRequestItem[];
  selected: CompanyRequestItem | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  } | null;
  ui: CompanyRequestUiState;
  getListStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  decideStatus: AsyncStatus;
  cancelStatus: AsyncStatus;
  deleteStatus: AsyncStatus;
  error: string | null;
}

const initialState: CompanyRequestState = {
  list: [],
  selected: null,
  pagination: null,
  ui: {
    page: 1,
    pageSize: 10,
    search: "",
    statusFilter: "",
  },
  getListStatus: "idle",
  getByIdStatus: "idle",
  decideStatus: "idle",
  cancelStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

function upsertListItem(list: CompanyRequestItem[], item: CompanyRequestItem) {
  const index = list.findIndex((row) => row.id === item.id);
  if (index === -1) return list;
  const next = [...list];
  next[index] = { ...next[index], ...item };
  return next;
}

const companyRequestSlice = createSlice({
  name: "companyRequest",
  initialState,
  reducers: {
    setCompanyRequestSearch: (state, action: PayloadAction<string>) => {
      state.ui.search = action.payload;
      state.ui.page = 1;
    },
    setCompanyRequestStatusFilter: (
      state,
      action: PayloadAction<CompanyRequestStatus | "">,
    ) => {
      state.ui.statusFilter = action.payload;
      state.ui.page = 1;
    },
    setCompanyRequestPage: (state, action: PayloadAction<number>) => {
      state.ui.page = action.payload;
    },
    setCompanyRequestPageSize: (state, action: PayloadAction<number>) => {
      state.ui.pageSize = action.payload;
      state.ui.page = 1;
    },
    clearCompanyRequestSelected: (state) => {
      state.selected = null;
      state.getByIdStatus = "idle";
    },
    clearCompanyRequestError: (state) => {
      state.error = null;
    },
    resetCompanyRequestUi: (state) => {
      state.ui = { ...initialState.ui };
      state.list = [];
      state.pagination = null;
      state.selected = null;
      state.getListStatus = "idle";
      state.getByIdStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCompanyRequests.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyRequests.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        state.list = action.payload.list;
        state.pagination = action.payload.pagination;
      })
      .addCase(getCompanyRequests.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = [];
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch requests";
      })
      .addCase(getCompanyRequestById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyRequestById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.selected = action.payload;
        state.list = upsertListItem(state.list, action.payload);
      })
      .addCase(getCompanyRequestById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch request details";
      })
      .addCase(decideCompanyRequest.pending, (state) => {
        state.decideStatus = "isLoading";
        state.error = null;
      })
      .addCase(decideCompanyRequest.fulfilled, (state, action) => {
        state.decideStatus = "succeeded";
        if (action.payload.item) {
          state.selected = action.payload.item;
          state.list = upsertListItem(state.list, action.payload.item);
        }
      })
      .addCase(decideCompanyRequest.rejected, (state, action) => {
        state.decideStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to submit decision";
      })
      .addCase(cancelCompanyRequest.pending, (state) => {
        state.cancelStatus = "isLoading";
        state.error = null;
      })
      .addCase(cancelCompanyRequest.fulfilled, (state, action) => {
        state.cancelStatus = "succeeded";
        if (action.payload.item) {
          state.selected = action.payload.item;
          state.list = upsertListItem(state.list, action.payload.item);
        } else {
          const cancelled: CompanyRequestItem = {
            id: action.payload.id,
            title: state.selected?.title ?? "",
            status: "cancelled",
          };
          if (state.selected?.id === action.payload.id) {
            state.selected = { ...state.selected, status: "cancelled" };
          }
          state.list = upsertListItem(state.list, {
            ...(state.list.find((r) => r.id === action.payload.id) ??
              cancelled),
            status: "cancelled",
          });
        }
      })
      .addCase(cancelCompanyRequest.rejected, (state, action) => {
        state.cancelStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to cancel request";
      })
      .addCase(deleteCompanyRequest.pending, (state) => {
        state.deleteStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteCompanyRequest.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        const deletedId = action.payload.id;
        state.list = state.list.filter((row) => row.id !== deletedId);
        if (state.selected?.id === deletedId) {
          state.selected = null;
        }
        if (state.pagination) {
          state.pagination.total = Math.max(0, state.pagination.total - 1);
        }
      })
      .addCase(deleteCompanyRequest.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to delete request";
      });
  },
});

export const {
  setCompanyRequestSearch,
  setCompanyRequestStatusFilter,
  setCompanyRequestPage,
  setCompanyRequestPageSize,
  clearCompanyRequestSelected,
  clearCompanyRequestError,
  resetCompanyRequestUi,
} = companyRequestSlice.actions;

export default companyRequestSlice.reducer;
