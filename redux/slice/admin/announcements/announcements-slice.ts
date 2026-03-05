import { createSlice } from "@reduxjs/toolkit";
import {
  getAnnouncements,
  getAnnouncementStats,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type AnnouncementItem,
} from "./announcements";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface AnnouncementStats {
  totalAnnouncements: number;
  publishedCount: number;
  scheduledCount: number;
  draftCount: number;
  totalViews: number;
  totalEmailsSent: number;
  averageViewsPerAnnouncement: number;
}

export interface AdminAnnouncementsState {
  list: AnnouncementItem[] | null;
  pagination: { total: number; skip: number; limit: number } | null;
  stats: AnnouncementStats | null;
  getStatus: AsyncStatus;
  getStatsStatus: AsyncStatus;
  createStatus: AsyncStatus;
  updateStatus: AsyncStatus;
  deleteStatus: AsyncStatus;
  error: string | null;
}

const initialState: AdminAnnouncementsState = {
  list: null,
  pagination: null,
  stats: null,
  getStatus: "idle",
  getStatsStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

const defaultStats: AnnouncementStats = {
  totalAnnouncements: 0,
  publishedCount: 0,
  scheduledCount: 0,
  draftCount: 0,
  totalViews: 0,
  totalEmailsSent: 0,
  averageViewsPerAnnouncement: 0,
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
        const data = action.payload?.data;
        state.list = data?.items ?? [];
        state.pagination = data?.pagination ?? null;
      })
      .addCase(getAnnouncements.rejected, (state, action) => {
        state.getStatus = "failed";
        state.list = null;
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch announcements";
      })
      .addCase(getAnnouncementStats.pending, (state) => {
        state.getStatsStatus = "isLoading";
      })
      .addCase(getAnnouncementStats.fulfilled, (state, action) => {
        state.getStatsStatus = "succeeded";
        state.stats = action.payload?.data ?? defaultStats;
      })
      .addCase(getAnnouncementStats.rejected, (state) => {
        state.getStatsStatus = "failed";
        state.stats = null;
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
          if (state.stats) {
            state.stats.totalAnnouncements =
              (state.stats.totalAnnouncements ?? 0) + 1;
          }
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
          if (state.stats) {
            state.stats.totalAnnouncements = Math.max(
              0,
              (state.stats.totalAnnouncements ?? 0) - 1
            );
          }
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
