import { createSlice } from "@reduxjs/toolkit";
import {
  getStaffUserProfile,
  updateStaffUserProfile,
} from "./staff-user-profile";

export interface StaffUserProfile {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  role?: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffUserProfileState {
  getStatus: "idle" | "isLoading" | "succeeded" | "failed";
  updateStatus: "idle" | "isLoading" | "succeeded" | "failed";
  user: StaffUserProfile | null;
  error: string | null;
}

const initialState: StaffUserProfileState = {
  getStatus: "idle",
  updateStatus: "idle",
  user: null,
  error: null,
};

const staffUserProfileSlice = createSlice({
  name: "staffUserProfile",
  initialState,
  reducers: {
    resetStaffUserProfileState: (state) => {
      state.getStatus = "idle";
      state.updateStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStaffUserProfile.pending, (state) => {
        state.getStatus = "isLoading";
        state.error = null;
      })
      .addCase(getStaffUserProfile.fulfilled, (state, action) => {
        state.getStatus = "succeeded";
        state.user = action.payload?.data || null;
      })
      .addCase(getStaffUserProfile.rejected, (state, action) => {
        state.getStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch staff profile";
      })
      .addCase(updateStaffUserProfile.pending, (state) => {
        state.updateStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateStaffUserProfile.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.user = action.payload?.data || state.user;
      })
      .addCase(updateStaffUserProfile.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to update staff profile";
      });
  },
});

export const { resetStaffUserProfileState } = staffUserProfileSlice.actions;
export default staffUserProfileSlice.reducer;
