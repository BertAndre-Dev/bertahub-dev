import { createSlice } from "@reduxjs/toolkit";
import { getUserProfile, updateUserProfile } from "./user-profile";

export interface UserProfile {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address?: string;
  role?: string;
  residentType?: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileState {
  getStatus: "idle" | "isLoading" | "succeeded" | "failed";
  updateStatus: "idle" | "isLoading" | "succeeded" | "failed";
  user: UserProfile | null;
  error: string | null;
}

const initialState: UserProfileState = {
  getStatus: "idle",
  updateStatus: "idle",
  user: null,
  error: null,
};

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    resetUserProfileState: (state) => {
      state.getStatus = "idle";
      state.updateStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.getStatus = "isLoading";
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.getStatus = "succeeded";
        state.user = action.payload?.data || null;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.getStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch user profile";
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.updateStatus = "isLoading";
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.user = action.payload?.data || state.user;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to update user profile";
      });
  },
});

export const { resetUserProfileState } = userProfileSlice.actions;
export default userProfileSlice.reducer;
