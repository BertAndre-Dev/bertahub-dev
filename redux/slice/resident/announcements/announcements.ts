import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface ResidentAnnouncementItem {
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
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResidentAnnouncementsListResponse {
  success?: boolean;
  data?: {
    items: ResidentAnnouncementItem[];
    pagination: { total: number; skip: number; limit: number };
  };
  message?: string;
}

/** GET /api/v1/estates/:estateId/announcements - list for resident (read-only) */
export const getResidentAnnouncements = createAsyncThunk(
  "resident-announcements/getList",
  async (estateId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<ResidentAnnouncementsListResponse>(
        `/api/v1/estates/announcements/${estateId}`
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

/** GET /api/v1/estates/:estateId/announcements/:id - get one for resident */
export const getResidentAnnouncementById = createAsyncThunk(
  "resident-announcements/getById",
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
