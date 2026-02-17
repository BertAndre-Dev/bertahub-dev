import { createSlice } from "@reduxjs/toolkit";
import { getEstateProfile, updateEstateProfile } from "./estate-profile";

export interface EstateProfile {
  id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EstateProfileState {
  getStatus: "idle" | "isLoading" | "succeeded" | "failed";
  updateStatus: "idle" | "isLoading" | "succeeded" | "failed";
  estate: EstateProfile | null;
  error: string | null;
}

const initialState: EstateProfileState = {
  getStatus: "idle",
  updateStatus: "idle",
  estate: null,
  error: null,
};

const estateProfileSlice = createSlice({
  name: "estateProfile",
  initialState,
  reducers: {
    resetEstateProfileState: (state) => {
      state.getStatus = "idle";
      state.updateStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEstateProfile.pending, (state) => {
        state.getStatus = "isLoading";
      })
      .addCase(getEstateProfile.fulfilled, (state, action) => {
        state.getStatus = "succeeded";
        state.estate = action.payload?.data || null;
      })
      .addCase(getEstateProfile.rejected, (state, action) => {
        state.getStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch estate profile";
      })
      .addCase(updateEstateProfile.pending, (state) => {
        state.updateStatus = "isLoading";
      })
      .addCase(updateEstateProfile.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.estate = action.payload?.data || state.estate;
      })
      .addCase(updateEstateProfile.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to update estate profile";
      });
  },
});

export const { resetEstateProfileState } = estateProfileSlice.actions;
export default estateProfileSlice.reducer;
