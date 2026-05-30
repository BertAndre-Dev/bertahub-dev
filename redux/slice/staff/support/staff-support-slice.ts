import { createSlice } from "@reduxjs/toolkit";
import { submitStaffContactRequest } from "./staff-support";

export interface StaffSupportState {
  submitStatus: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
  lastSubmittedAt: string | null;
}

const initialState: StaffSupportState = {
  submitStatus: "idle",
  error: null,
  lastSubmittedAt: null,
};

const staffSupportSlice = createSlice({
  name: "staffSupport",
  initialState,
  reducers: {
    resetStaffSupportState: (state) => {
      state.submitStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitStaffContactRequest.pending, (state) => {
        state.submitStatus = "isLoading";
        state.error = null;
      })
      .addCase(submitStaffContactRequest.fulfilled, (state) => {
        state.submitStatus = "succeeded";
        state.lastSubmittedAt = new Date().toISOString();
      })
      .addCase(submitStaffContactRequest.rejected, (state, action) => {
        state.submitStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to submit contact request";
      });
  },
});

export const { resetStaffSupportState } = staffSupportSlice.actions;
export default staffSupportSlice.reducer;
