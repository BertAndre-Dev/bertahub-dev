import { createSlice } from "@reduxjs/toolkit";
import { getInvitedTenants, type InvitedTenantItem } from "./invited-tenants";

export interface InvitedTenantsState {
  list: InvitedTenantItem[];
  pagination: { total: number; page: number; limit: number; pages: number } | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: InvitedTenantsState = {
  list: [],
  pagination: null,
  status: "idle",
  error: null,
};

const invitedTenantsSlice = createSlice({
  name: "residentInvitedTenants",
  initialState,
  reducers: {
    clearInvitedTenants: (state) => {
      state.list = [];
      state.pagination = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getInvitedTenants.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getInvitedTenants.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;
        const data = action.payload?.data ?? [];
        state.list = Array.isArray(data) ? data : [];
        state.pagination = action.payload?.pagination ?? null;
      })
      .addCase(getInvitedTenants.rejected, (state, action) => {
        state.status = "failed";
        state.list = [];
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch invited tenants";
      });
  },
});

export const { clearInvitedTenants } = invitedTenantsSlice.actions;
export default invitedTenantsSlice.reducer;
