import { createSlice } from "@reduxjs/toolkit";
import { inviteTenant } from "./invite-tenant";

export interface InviteTenantState {
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: InviteTenantState = {
  status: "idle",
  error: null,
};

const inviteTenantSlice = createSlice({
  name: "residentInviteTenant",
  initialState,
  reducers: {
    clearInviteTenantState: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(inviteTenant.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(inviteTenant.fulfilled, (state) => {
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(inviteTenant.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to invite tenant";
      });
  },
});

export const { clearInviteTenantState } = inviteTenantSlice.actions;
export default inviteTenantSlice.reducer;
