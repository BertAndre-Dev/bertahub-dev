import { createSlice } from "@reduxjs/toolkit";
import {
  getResidentMarketplaceList,
  getResidentMarketplaceById,
  type ResidentMarketplaceItem,
} from "./marketplace";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface ResidentMarketplaceState {
  list: ResidentMarketplaceItem[] | null;
  current: ResidentMarketplaceItem | null;
  pagination: { page: number; limit: number; total: number; pages: number } | null;
  getListStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  error: string | null;
}

const initialState: ResidentMarketplaceState = {
  list: null,
  current: null,
  pagination: null,
  getListStatus: "idle",
  getByIdStatus: "idle",
  error: null,
};

const residentMarketplaceSlice = createSlice({
  name: "residentMarketplace",
  initialState,
  reducers: {
    clearCurrentResidentMarketplace: (state) => {
      state.current = null;
      state.getByIdStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getResidentMarketplaceList.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getResidentMarketplaceList.fulfilled, (state, action) => {
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
      .addCase(getResidentMarketplaceList.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = null;
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch marketplace";
      })
      .addCase(getResidentMarketplaceById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getResidentMarketplaceById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.current = action.payload?.data ?? null;
      })
      .addCase(getResidentMarketplaceById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.current = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch listing";
      });
  },
});

export const { clearCurrentResidentMarketplace } = residentMarketplaceSlice.actions;
export default residentMarketplaceSlice.reducer;
