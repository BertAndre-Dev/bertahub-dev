import { createSlice } from "@reduxjs/toolkit";
import {
  getResidentAnnouncements,
  getResidentAnnouncementById,
  type ResidentAnnouncementItem,
} from "./announcements";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface ResidentAnnouncementsState {
  list: ResidentAnnouncementItem[] | null;
  current: ResidentAnnouncementItem | null;
  pagination: { total: number; skip: number; limit: number } | null;
  getListStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  error: string | null;
}

const initialState: ResidentAnnouncementsState = {
  list: null,
  current: null,
  pagination: null,
  getListStatus: "idle",
  getByIdStatus: "idle",
  error: null,
};

const residentAnnouncementsSlice = createSlice({
  name: "residentAnnouncements",
  initialState,
  reducers: {
    clearCurrentResidentAnnouncement: (state) => {
      state.current = null;
      state.getByIdStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getResidentAnnouncements.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getResidentAnnouncements.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        const data = action.payload?.data;
        state.list = data?.items ?? [];
        state.pagination = data?.pagination ?? null;
      })
      .addCase(getResidentAnnouncements.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = null;
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch announcements";
      })
      .addCase(getResidentAnnouncementById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getResidentAnnouncementById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.current = action.payload?.data ?? null;
      })
      .addCase(getResidentAnnouncementById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.current = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch announcement";
      });
  },
});

export const { clearCurrentResidentAnnouncement } =
  residentAnnouncementsSlice.actions;
export default residentAnnouncementsSlice.reducer;
