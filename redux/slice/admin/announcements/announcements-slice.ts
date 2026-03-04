import { createSlice } from "@reduxjs/toolkit";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type AnnouncementItem,
} from "./announcements";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface AdminAnnouncementsState {
  list: AnnouncementItem[] | null;
  getStatus: AsyncStatus;
  createStatus: AsyncStatus;
  updateStatus: AsyncStatus;
  deleteStatus: AsyncStatus;
  error: string | null;
}

const initialState: AdminAnnouncementsState = {
  list: null,
  getStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

const announcementsSlice = createSlice({
  name: "adminAnnouncements",
  initialState,
  reducers: {
    resetAnnouncementsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAnnouncements.pending, (state) => {
        state.getStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAnnouncements.fulfilled, (state, action) => {
        state.getStatus = "succeeded";
        const payload = action.payload;
        state.list = Array.isArray(payload)
          ? payload
          : (payload?.data ?? []);
      })
      .addCase(getAnnouncements.rejected, (state, action) => {
        state.getStatus = "failed";
        state.list = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch announcements";
      })
      .addCase(createAnnouncement.pending, (state) => {
        state.createStatus = "isLoading";
        state.error = null;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const newItem = action.payload?.data;
        if (newItem) {
          state.list = [newItem, ...(state.list ?? [])];
        }
      })
      .addCase(createAnnouncement.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to create announcement";
      })
      .addCase(updateAnnouncement.pending, (state) => {
        state.updateStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateAnnouncement.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const updated = action.payload?.data;
        if (updated?.id && state.list) {
          const i = state.list.findIndex((a) => a.id === updated.id);
          if (i !== -1) state.list[i] = { ...state.list[i], ...updated };
        }
      })
      .addCase(updateAnnouncement.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to update announcement";
      })
      .addCase(deleteAnnouncement.pending, (state) => {
        state.deleteStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        const id = (action.payload as { deletedId?: string })?.deletedId;
        if (id && state.list) {
          state.list = state.list.filter((a) => a.id !== id);
        }
      })
      .addCase(deleteAnnouncement.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to delete announcement";
      });
  },
});

export const { resetAnnouncementsState } = announcementsSlice.actions;
export default announcementsSlice.reducer;
