import { createSlice } from "@reduxjs/toolkit";
import {
  createRent,
  getOwnerRents,
  getTenantRents,
  getRentById,
  deleteRent,
  updateRent,
  activateRent,
  suspendRent,
  payRent,
  type RentItem,
  type PaginationMeta,
} from "./rent-mgt";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface ResidentRentMgtState {
  createRentStatus: AsyncStatus;
  getOwnerRentsStatus: AsyncStatus;
  getTenantRentsStatus: AsyncStatus;
  getRentByIdStatus: AsyncStatus;
  payRentStatus: AsyncStatus;
  ownerRents: RentItem[] | null;
  tenantRents: RentItem[] | null;
  pagination: PaginationMeta | null;
  tenantPagination: PaginationMeta | null;
  currentRent: RentItem | null;
  error: string | null;
}

const initialState: ResidentRentMgtState = {
  createRentStatus: "idle",
  getOwnerRentsStatus: "idle",
  getTenantRentsStatus: "idle",
  getRentByIdStatus: "idle",
  payRentStatus: "idle",
  ownerRents: null,
  tenantRents: null,
  pagination: null,
  tenantPagination: null,
  currentRent: null,
  error: null,
};

const residentRentMgtSlice = createSlice({
  name: "residentRentMgt",
  initialState,
  reducers: {
    clearCurrentRent: (state) => {
      state.currentRent = null;
      state.getRentByIdStatus = "idle";
    },
    resetResidentRentMgt: (state) => {
      state.createRentStatus = "idle";
      state.getOwnerRentsStatus = "idle";
      state.getTenantRentsStatus = "idle";
      state.getRentByIdStatus = "idle";
      state.payRentStatus = "idle";
      state.ownerRents = null;
      state.tenantRents = null;
      state.pagination = null;
      state.tenantPagination = null;
      state.currentRent = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRent.pending, (state) => {
        state.createRentStatus = "isLoading";
        state.error = null;
      })
      .addCase(createRent.fulfilled, (state, action) => {
        state.createRentStatus = "succeeded";
        const newRent = action.payload?.data;
        if (newRent) {
          const list = state.ownerRents ?? [];
          state.ownerRents = [newRent, ...list];
          if (state.pagination) {
            state.pagination.total += 1;
          }
        }
      })
      .addCase(createRent.rejected, (state, action) => {
        state.createRentStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to create rent";
      })
      .addCase(getOwnerRents.pending, (state) => {
        state.getOwnerRentsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getOwnerRents.fulfilled, (state, action) => {
        state.getOwnerRentsStatus = "succeeded";
        state.ownerRents = action.payload?.data ?? [];
        state.pagination = action.payload?.pagination ?? null;
      })
      .addCase(getOwnerRents.rejected, (state, action) => {
        state.getOwnerRentsStatus = "failed";
        state.ownerRents = null;
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch rents";
      })
      .addCase(getTenantRents.pending, (state) => {
        state.getTenantRentsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getTenantRents.fulfilled, (state, action) => {
        state.getTenantRentsStatus = "succeeded";
        state.tenantRents = action.payload?.data ?? [];
        state.tenantPagination = action.payload?.pagination ?? null;
      })
      .addCase(getTenantRents.rejected, (state, action) => {
        state.getTenantRentsStatus = "failed";
        state.tenantRents = null;
        state.tenantPagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch rents";
      })
      .addCase(getRentById.pending, (state) => {
        state.getRentByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getRentById.fulfilled, (state, action) => {
        state.getRentByIdStatus = "succeeded";
        state.currentRent = action.payload?.data ?? null;
      })
      .addCase(getRentById.rejected, (state, action) => {
        state.getRentByIdStatus = "failed";
        state.currentRent = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch rent";
      })
      .addCase(deleteRent.fulfilled, (state, action) => {
        const id = (action.payload as { deletedId?: string })?.deletedId;
        if (id && state.ownerRents) {
          state.ownerRents = state.ownerRents.filter((r) => r.id !== id);
          if (state.pagination) state.pagination.total = Math.max(0, state.pagination.total - 1);
        }
        if (state.currentRent?.id === id) state.currentRent = null;
      })
      .addCase(updateRent.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (updated?.id && state.ownerRents) {
          const i = state.ownerRents.findIndex((r) => r.id === updated.id);
          if (i !== -1) state.ownerRents[i] = { ...state.ownerRents[i], ...updated };
        }
        if (state.currentRent?.id === updated?.id)
          state.currentRent = state.currentRent ? { ...state.currentRent, ...updated } : null;
      })
      .addCase(activateRent.fulfilled, (state, action) => {
        const id = (action.payload as { rentId?: string })?.rentId;
        if (id && state.ownerRents) {
          const r = state.ownerRents.find((x) => x.id === id);
          if (r) r.status = "active";
        }
        if (state.currentRent?.id === id) state.currentRent = state.currentRent ? { ...state.currentRent, status: "active" } : null;
      })
      .addCase(suspendRent.fulfilled, (state, action) => {
        const id = (action.payload as { rentId?: string })?.rentId;
        if (id && state.ownerRents) {
          const r = state.ownerRents.find((x) => x.id === id);
          if (r) r.status = "suspended";
        }
        if (state.currentRent?.id === id) state.currentRent = state.currentRent ? { ...state.currentRent, status: "suspended" } : null;
      })
      .addCase(payRent.pending, (state) => {
        state.payRentStatus = "isLoading";
        state.error = null;
      })
      .addCase(payRent.fulfilled, (state, action) => {
        state.payRentStatus = "succeeded";
        const updated = action.payload?.data;
        if (updated?.id) {
          if (state.ownerRents) {
            const i = state.ownerRents.findIndex((r) => r.id === updated.id);
            if (i !== -1) state.ownerRents[i] = { ...state.ownerRents[i], ...updated };
          }
          if (state.tenantRents) {
            const j = state.tenantRents.findIndex((r) => r.id === updated.id);
            if (j !== -1) state.tenantRents[j] = { ...state.tenantRents[j], ...updated };
          }
        }
        if (state.currentRent?.id === updated?.id)
          state.currentRent = state.currentRent ? { ...state.currentRent, ...updated } : null;
      })
      .addCase(payRent.rejected, (state, action) => {
        state.payRentStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to pay rent";
      });
  },
});

export const {
  clearCurrentRent,
  resetResidentRentMgt,
} = residentRentMgtSlice.actions;
export default residentRentMgtSlice.reducer;
