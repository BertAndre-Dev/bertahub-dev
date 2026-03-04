import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface AnnouncementItem {
  id?: string;
  title?: string;
  description?: string;
  sendTo?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  description: string;
  sendTo?: string;
}

export interface UpdateAnnouncementPayload {
  id: string;
  title?: string;
  description?: string;
  sendTo?: string;
}

export interface AnnouncementsListResponse {
  success?: boolean;
  data?: AnnouncementItem[];
  message?: string;
}

/** List announcements. GET /api/v1/announcements */
export const getAnnouncements = createAsyncThunk(
  "admin-announcements/getAnnouncements",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<AnnouncementsListResponse>(
        "/api/v1/announcements"
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

/** Create announcement. POST /api/v1/announcements */
export const createAnnouncement = createAsyncThunk(
  "admin-announcements/createAnnouncement",
  async (payload: CreateAnnouncementPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/announcements", payload);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to create announcement",
      });
    }
  }
);

/** Update announcement. PUT /api/v1/announcements/{id} */
export const updateAnnouncement = createAsyncThunk(
  "admin-announcements/updateAnnouncement",
  async (payload: UpdateAnnouncementPayload, { rejectWithValue }) => {
    try {
      const { id, ...body } = payload;
      const res = await axiosInstance.put(`/api/v1/announcements/${id}`, body);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update announcement",
      });
    }
  }
);

/** Delete announcement. DELETE /api/v1/announcements/{id} */
export const deleteAnnouncement = createAsyncThunk(
  "admin-announcements/deleteAnnouncement",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/announcements/${id}`);
      return { ...res.data, deletedId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete announcement",
      });
    }
  }
);
