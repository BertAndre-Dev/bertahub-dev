import { createSlice } from "@reduxjs/toolkit";
import {
  getMarketplaceList,
  getMarketplaceById,
  createMarketplace,
  updateMarketplace,
  suspendMarketplace,
  activateMarketplace,
  deleteMarketplace,
  type MarketplaceItem,
} from "./marketplace";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface SuperAdminMarketplaceState {
  list: MarketplaceItem[] | null;
  current: MarketplaceItem | null;
  pagination: { page: number; limit: number; total: number; pages: number } | null;
  getListStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  createStatus: AsyncStatus;
  updateStatus: AsyncStatus;
  deleteStatus: AsyncStatus;
  error: string | null;
}

const initialState: SuperAdminMarketplaceState = {
  list: null,
  current: null,
  pagination: null,
  getListStatus: "idle",
  getByIdStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

const marketplaceSlice = createSlice({
  name: "superAdminMarketplace",
  initialState,
  reducers: {
    clearCurrentMarketplace: (state) => {
      state.current = null;
      state.getByIdStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMarketplaceList.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getMarketplaceList.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        state.list = action.payload?.data ?? [];
        const p = action.payload?.pagination;
        state.pagination = p
          ? {
              page: p.page ?? 1,
              limit: p.limit ?? 10,
              total: p.total ?? 0,
              pages: p.pages ?? 0,
            }
          : null;
      })
      .addCase(getMarketplaceList.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = null;
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch marketplace";
      })
      .addCase(getMarketplaceById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getMarketplaceById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.current = action.payload?.data ?? null;
      })
      .addCase(getMarketplaceById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.current = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch listing";
      })
      .addCase(createMarketplace.pending, (state) => {
        state.createStatus = "isLoading";
        state.error = null;
      })
      .addCase(createMarketplace.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const newItem = action.payload?.data;
        if (newItem) {
          state.list = [newItem, ...(state.list ?? [])];
          if (state.pagination) {
            state.pagination.total += 1;
          }
        }
      })
      .addCase(createMarketplace.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to create listing";
      })
      .addCase(updateMarketplace.pending, (state) => {
        state.updateStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateMarketplace.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.updateStatus = "succeeded";
        const updated = action.payload?.data;
        if (updated?.id && state.list) {
          const i = state.list.findIndex((x) => x.id === updated.id);
          if (i !== -1) state.list[i] = { ...state.list[i], ...updated };
        }
        if (state.current?.id === updated?.id) {
          state.current = state.current ? { ...state.current, ...updated } : null;
        }
      })
      .addCase(updateMarketplace.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to update listing";
      })
      .addCase(suspendMarketplace.fulfilled, (state, action) => {
        const id = (action.payload as { marketPlaceId?: string })?.marketPlaceId;
        if (id && state.list) {
          const r = state.list.find((x) => x.id === id);
          if (r) r.status = "suspended";
        }
        if (state.current?.id === id && state.current) {
          state.current.status = "suspended";
        }
      })
      .addCase(activateMarketplace.fulfilled, (state, action) => {
        const id = (action.payload as { marketPlaceId?: string })?.marketPlaceId;
        if (id && state.list) {
          const r = state.list.find((x) => x.id === id);
          if (r) r.status = "active";
        }
        if (state.current?.id === id && state.current) {
          state.current.status = "active";
        }
      })
      .addCase(deleteMarketplace.fulfilled, (state, action) => {
        const id = (action.payload as { deletedId?: string })?.deletedId;
        if (id && state.list) {
          state.list = state.list.filter((x) => x.id !== id);
          if (state.pagination) {
            state.pagination.total = Math.max(0, state.pagination.total - 1);
          }
        }
        if (state.current?.id === id) state.current = null;
      });
  },
});

export const { clearCurrentMarketplace } = marketplaceSlice.actions;
export default marketplaceSlice.reducer;
