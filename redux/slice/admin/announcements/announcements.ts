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
  /** Public URL of the uploaded image (JPEG, PNG, WebP, GIF) */
  image?: string;
  imageUrl?: string;
  /** Public URL of the uploaded attachment (PDF, DOCX, etc.) */
  file?: string;
  fileUrl?: string;
  fileName?: string;
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
  /** When true, send immediately; schedule field is ignored. */
  sendNow?: boolean;
  /** Optional image (JPEG, PNG, WebP, GIF) up to 5MB. */
  image?: File | null;
  /** Optional attachment (PDF, DOCX, etc.) up to 10MB. */
  file?: File | null;
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
  sendNow?: boolean;
  image?: File | null;
  file?: File | null;
}

type AnnouncementRequestBody =
  | { body: FormData; isMultipart: true }
  | { body: Record<string, unknown>; isMultipart: false };

/** Returns true if the payload contains at least one File (image / attachment). */
function payloadHasFile(payload: Record<string, unknown>): boolean {
  return Object.values(payload).some((v) => v instanceof File);
}

/**
 * Strip `undefined` / `null` / empty-string / empty-array entries so unset
 * optional fields are never sent to the backend.
 */
function compactPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

/**
 * Build the request body for create/update endpoints.
 *
 * - When no file is being uploaded → use `application/json` so booleans,
 *   numbers and arrays travel as their native JSON types. This is required
 *   because the backend validates with `@IsBoolean()` / `@IsArray()`, which
 *   reject the "true"/"false" strings that multipart would otherwise force.
 * - When a file is present → fall back to `multipart/form-data`, encoding
 *   booleans/numbers as plain strings and arrays as JSON strings. For this
 *   path to validate cleanly the backend MUST apply a `@Transform` on
 *   boolean/array fields (e.g. `@Transform(({ value }) => JSON.parse(value))`).
 */
function buildAnnouncementRequest(
  payload: Record<string, unknown>,
): AnnouncementRequestBody {
  const cleaned = compactPayload(payload);

  if (!payloadHasFile(cleaned)) {
    return { body: cleaned, isMultipart: false };
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(cleaned)) {
    if (value instanceof File) {
      form.append(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      form.append(key, JSON.stringify(value));
      continue;
    }
    if (typeof value === "boolean" || typeof value === "number") {
      form.append(key, String(value));
      continue;
    }
    form.append(key, value as string);
  }
  return { body: form, isMultipart: true };
}

export interface AnnouncementsListResponse {
  success?: boolean;
  data?: {
    items: AnnouncementItem[];
    pagination: { total: number; page: number; limit: number; pages: number };
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

/** List announcements. GET /api/v1/estates/announcements?estateId=...&page=...&limit=...&status=... */
export const getAnnouncements = createAsyncThunk(
  "admin-announcements/getAnnouncements",
  async (
    params: { estateId: string; page?: number; limit?: number; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const { estateId, page = 1, limit = 20, status } = params;
      const res = await axiosInstance.get<AnnouncementsListResponse>(
        "/api/v1/estates/announcements",
        { params: { estateId, page, limit, ...(status ? { status } : {}) } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch announcements",
      });
    }
  },
);

/** Get announcement stats. GET /api/v1/estates/:estateId/announcements/stats/overview */
export const getAnnouncementStats = createAsyncThunk(
  "admin-announcements/getAnnouncementStats",
  async (estateId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<AnnouncementStatsResponse>(
        `/api/v1/estates/${estateId}/announcements/stats/overview`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch stats",
      });
    }
  },
);

/** Create announcement. POST /api/v1/estates/announcements (JSON or multipart/form-data) */
export const createAnnouncement = createAsyncThunk(
  "admin-announcements/createAnnouncement",
  async (payload: CreateAnnouncementPayload, { rejectWithValue }) => {
    try {
      const { body, isMultipart } = buildAnnouncementRequest(
        payload as unknown as Record<string, unknown>,
      );
      const res = await axiosInstance.post(
        "/api/v1/estates/announcements",
        body,
        isMultipart
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : { headers: { "Content-Type": "application/json" } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to create announcement",
      });
    }
  },
);

/** Get one announcement. GET /api/v1/estates/announcements/:id (admin & resident) */
export const getAnnouncementById = createAsyncThunk(
  "admin-announcements/getAnnouncementById",
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
  },
);

/** Update announcement. PUT /api/v1/estates/announcements/:id (JSON or multipart/form-data, allowed when < 1 hour since posted) */
export const updateAnnouncement = createAsyncThunk(
  "admin-announcements/updateAnnouncement",
  async (payload: UpdateAnnouncementPayload, { rejectWithValue }) => {
    try {
      const { id, ...rest } = payload;
      if (!id) throw new Error("Announcement id is required");
      const { body, isMultipart } = buildAnnouncementRequest(
        rest as unknown as Record<string, unknown>,
      );
      const res = await axiosInstance.put(
        `/api/v1/estates/announcements/${id}`,
        body,
        isMultipart
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : { headers: { "Content-Type": "application/json" } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to update announcement",
      });
    }
  },
);

/** Delete announcement. DELETE /api/v1/estates/announcements/:id */
export const deleteAnnouncement = createAsyncThunk(
  "admin-announcements/deleteAnnouncement",
  async (
    { estateId, id }: { estateId: string; id: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/estates/announcements/${id}`,
      );
      return { ...res.data, deletedId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to delete announcement",
      });
    }
  },
);
