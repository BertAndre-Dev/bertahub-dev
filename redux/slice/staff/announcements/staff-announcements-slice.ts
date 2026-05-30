import { createSlice } from "@reduxjs/toolkit";
import {
  getStaffAnnouncements,
  getStaffAnnouncementById,
  type StaffAnnouncementItem,
} from "./staff-announcements";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface StaffAnnouncementsState {
  list: StaffAnnouncementItem[] | null;
  current: StaffAnnouncementItem | null;
  pagination: { total: number; page: number; limit: number; pages: number } | null;
  getListStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  error: string | null;
}

const initialState: StaffAnnouncementsState = {
  list: null,
  current: null,
  pagination: null,
  getListStatus: "idle",
  getByIdStatus: "idle",
  error: null,
};

const staffAnnouncementsSlice = createSlice({
  name: "staffAnnouncements",
  initialState,
  reducers: {
    clearCurrentStaffAnnouncement: (state) => {
      state.current = null;
      state.getByIdStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStaffAnnouncements.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getStaffAnnouncements.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        const data = action.payload?.data;
        state.list = data?.items ?? [];
        state.pagination = data?.pagination ?? null;
      })
      .addCase(getStaffAnnouncements.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = null;
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch announcements";
      })
      .addCase(getStaffAnnouncementById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getStaffAnnouncementById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.current = action.payload?.data ?? null;
      })
      .addCase(getStaffAnnouncementById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.current = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch announcement";
      });
  },
});

export const { clearCurrentStaffAnnouncement } =
  staffAnnouncementsSlice.actions;
export default staffAnnouncementsSlice.reducer;
