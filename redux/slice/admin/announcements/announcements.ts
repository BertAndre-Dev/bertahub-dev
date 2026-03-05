import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface AnnouncementItem {
  id?: string;
  estateId?: string;
  title?: string;
  content?: string;
  description?: string;
  status?: string;
  scheduledFor?: string;
  sentAt?: string | null;
  viewCount?: number;
  viewedBy?: string[];
  emailSent?: boolean;
  emailsSent?: number;
  failedEmailAddresses?: string[];
  isActive?: boolean;
  jobId?: string;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAnnouncementPayload {
  estateId: string;
  title: string;
  content: string;
  description?: string;
  scheduledFor?: string;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  priority?: string;
}

export interface UpdateAnnouncementPayload {
  estateId: string;
  id: string;
  title?: string;
  content?: string;
  description?: string;
  scheduledFor?: string;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  priority?: string;
}

export interface AnnouncementsListResponse {
  success?: boolean;
  data?: {
    items: AnnouncementItem[];
    pagination: { total: number; skip: number; limit: number };
  };
  message?: string;
}

export interface AnnouncementStatsResponse {
  success?: boolean;
  data?: {
    totalAnnouncements: number;
    publishedCount: number;
    scheduledCount: number;
    draftCount: number;
    totalViews: number;
    totalEmailsSent: number;
    averageViewsPerAnnouncement: number;
  };
  message?: string;
}

/** List announcements. GET /api/v1/estates/:estateId/announcements */
export const getAnnouncements = createAsyncThunk(
  "admin-announcements/getAnnouncements",
  async (estateId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<AnnouncementsListResponse>(
        `/api/v1/estates/${estateId}/announcements`
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch announcements",
      });
    }
  }
);

/** Get announcement stats. GET /api/v1/estates/:estateId/announcements/stats/overview */
export const getAnnouncementStats = createAsyncThunk(
  "admin-announcements/getAnnouncementStats",
  async (estateId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<AnnouncementStatsResponse>(
        `/api/v1/estates/${estateId}/announcements/stats/overview`
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch stats",
      });
    }
  }
);

/** Create announcement. POST /api/v1/estates/announcements */
export const createAnnouncement = createAsyncThunk(
  "admin-announcements/createAnnouncement",
  async (payload: CreateAnnouncementPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/estates/announcements",
        payload
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to create announcement",
      });
    }
  }
);

/** Get one announcement. GET /api/v1/estates/:estateId/announcements/:id */
export const getAnnouncementById = createAsyncThunk(
  "admin-announcements/getAnnouncementById",
  async (
    { estateId, id }: { estateId: string; id: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/estates/${estateId}/announcements/${id}`
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch announcement",
      });
    }
  }
);

/** Update announcement. PUT /api/v1/estates/:estateId/announcements/:id (allowed within 1 hour) */
export const updateAnnouncement = createAsyncThunk(
  "admin-announcements/updateAnnouncement",
  async (payload: UpdateAnnouncementPayload, { rejectWithValue }) => {
    try {
      const { estateId, id, ...body } = payload;
      const res = await axiosInstance.put(
        `/api/v1/estates/${estateId}/announcements/${id}`,
        body
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update announcement",
      });
    }
  }
);

/** Delete announcement. DELETE /api/v1/estates/:estateId/announcements/:id */
export const deleteAnnouncement = createAsyncThunk(
  "admin-announcements/deleteAnnouncement",
  async (
    { estateId, id }: { estateId: string; id: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/estates/${estateId}/announcements/${id}`
      );
      return { ...res.data, deletedId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete announcement",
      });
    }
  }
);
