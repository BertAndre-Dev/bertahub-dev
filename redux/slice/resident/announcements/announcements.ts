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
    pagination: { total: number; page: number; limit: number; pages: number };
  };
  message?: string;
}

/** GET /api/v1/estates/announcements?estateId=...&page=...&limit=... - list for resident (read-only) */
export const getResidentAnnouncements = createAsyncThunk(
  "resident-announcements/getList",
  async (
    params: { estateId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const { estateId, page = 1, limit = 20 } = params;
      const res = await axiosInstance.get<ResidentAnnouncementsListResponse>(
        "/api/v1/estates/announcements",
        { params: { estateId, page, limit } },
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

/** GET /api/v1/estates/announcements/:id - get one (admin & resident) */
export const getResidentAnnouncementById = createAsyncThunk(
  "resident-announcements/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/estates/announcements/${id}`,
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
