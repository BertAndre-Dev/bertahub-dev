import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  cancelEstateAdminRequest,
  decideEstateAdminRequest,
  deleteEstateAdminRequest,
  getEstateAdminRequestById,
  getEstateAdminRequests,
  type EstateAdminRequestItem,
  type EstateAdminRequestStatus,
} from "./estate-admin-request";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface EstateAdminRequestUiState {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: EstateAdminRequestStatus | "";
}

interface EstateAdminRequestState {
  list: EstateAdminRequestItem[];
  selected: EstateAdminRequestItem | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  } | null;
  ui: EstateAdminRequestUiState;
  getListStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  decideStatus: AsyncStatus;
  cancelStatus: AsyncStatus;
  deleteStatus: AsyncStatus;
  error: string | null;
}

const initialState: EstateAdminRequestState = {
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

function upsertListItem(list: EstateAdminRequestItem[], item: EstateAdminRequestItem) {
  const index = list.findIndex((row) => row.id === item.id);
  if (index === -1) return list;
  const next = [...list];
  next[index] = { ...next[index], ...item };
  return next;
}

const estateAdminRequestSlice = createSlice({
  name: "estateAdminRequest",
  initialState,
  reducers: {
    setEstateAdminRequestSearch: (state, action: PayloadAction<string>) => {
      state.ui.search = action.payload;
      state.ui.page = 1;
    },
    setEstateAdminRequestStatusFilter: (
      state,
      action: PayloadAction<EstateAdminRequestStatus | "">,
    ) => {
      state.ui.statusFilter = action.payload;
      state.ui.page = 1;
    },
    setEstateAdminRequestPage: (state, action: PayloadAction<number>) => {
      state.ui.page = action.payload;
    },
    setEstateAdminRequestPageSize: (state, action: PayloadAction<number>) => {
      state.ui.pageSize = action.payload;
      state.ui.page = 1;
    },
    clearEstateAdminRequestSelected: (state) => {
      state.selected = null;
      state.getByIdStatus = "idle";
    },
    clearEstateAdminRequestError: (state) => {
      state.error = null;
    },
    resetEstateAdminRequestUi: (state) => {
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
      .addCase(getEstateAdminRequests.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getEstateAdminRequests.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        state.list = action.payload.list;
        state.pagination = action.payload.pagination;
      })
      .addCase(getEstateAdminRequests.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = [];
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch requests";
      })
      .addCase(getEstateAdminRequestById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getEstateAdminRequestById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.selected = action.payload;
        state.list = upsertListItem(state.list, action.payload);
      })
      .addCase(getEstateAdminRequestById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch request details";
      })
      .addCase(decideEstateAdminRequest.pending, (state) => {
        state.decideStatus = "isLoading";
        state.error = null;
      })
      .addCase(decideEstateAdminRequest.fulfilled, (state, action) => {
        state.decideStatus = "succeeded";
        if (action.payload.item) {
          state.selected = action.payload.item;
          state.list = upsertListItem(state.list, action.payload.item);
        }
      })
      .addCase(decideEstateAdminRequest.rejected, (state, action) => {
        state.decideStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to submit decision";
      })
      .addCase(cancelEstateAdminRequest.pending, (state) => {
        state.cancelStatus = "isLoading";
        state.error = null;
      })
      .addCase(cancelEstateAdminRequest.fulfilled, (state, action) => {
        state.cancelStatus = "succeeded";
        if (action.payload.item) {
          state.selected = action.payload.item;
          state.list = upsertListItem(state.list, action.payload.item);
        } else {
          const cancelled: EstateAdminRequestItem = {
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
      .addCase(cancelEstateAdminRequest.rejected, (state, action) => {
        state.cancelStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to cancel request";
      })
      .addCase(deleteEstateAdminRequest.pending, (state) => {
        state.deleteStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteEstateAdminRequest.fulfilled, (state, action) => {
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
      .addCase(deleteEstateAdminRequest.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to delete request";
      });
  },
});

export const {
  setEstateAdminRequestSearch,
  setEstateAdminRequestStatusFilter,
  setEstateAdminRequestPage,
  setEstateAdminRequestPageSize,
  clearEstateAdminRequestSelected,
  clearEstateAdminRequestError,
  resetEstateAdminRequestUi,
} = estateAdminRequestSlice.actions;

export default estateAdminRequestSlice.reducer;
