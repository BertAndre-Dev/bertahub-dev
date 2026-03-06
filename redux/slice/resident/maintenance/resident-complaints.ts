import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface ResidentComplaintResident {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ResidentComplaintAddress {
  id?: string;
  _id?: string;
  data?: Record<string, string>;
}

export interface ResidentComplaintItem {
  id: string;
  _id?: string;
  title?: string;
  description: string;
  category?: string;
  status: string;
  priority?: string;
  /** API may return string (id) or populated object with firstName, lastName, etc. */
  residentId?: string | ResidentComplaintResident;
  estateId?: string;
  resident?: ResidentComplaintResident;
  addressId?: ResidentComplaintAddress | string;
  ticketNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  image?: string;
}

export interface ResidentCommentItem {
  id: string;
  _id?: string;
  complaintId: string;
  userId: string;
  text: string;
  user?: { firstName?: string; lastName?: string };
  createdAt?: string;
}

export interface CreateComplaintPayload {
  title: string;
  description: string;
  category: string;
  residentId: string;
  addressId: string;
  estateId: string;
  image?: string;
  status?: string;
}

/** POST /api/v1/complaints */
export const createComplaint = createAsyncThunk(
  "resident-complaints/create",
  async (payload: CreateComplaintPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/complaints", {
        ...payload,
        status: payload.status ?? "pending",
      });
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err?.response?.data?.message ?? "Failed to create complaint"
      );
    }
  }
);

/** GET /api/v1/complaints/by-address/:addressId */
export const getComplaintsByAddress = createAsyncThunk(
  "resident-complaints/getByAddress",
  async (
    {
      addressId,
      page = 1,
      limit = 20,
    }: { addressId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/complaints/by-address/${addressId}`,
        { params: { page, limit } }
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err?.response?.data?.message ?? "Failed to fetch complaints"
      );
    }
  }
);

/** GET /api/v1/complaints/:id */
export const getComplaintById = createAsyncThunk(
  "resident-complaints/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/complaints/${id}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err?.response?.data?.message ?? "Failed to fetch complaint"
      );
    }
  }
);

/** PUT /api/v1/complaints/:id */
export const updateComplaint = createAsyncThunk(
  "resident-complaints/update",
  async (
    {
      id,
      ...body
    }: Partial<CreateComplaintPayload> & { id: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.put(`/api/v1/complaints/${id}`, body);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err?.response?.data?.message ?? "Failed to update complaint"
      );
    }
  }
);

/** DELETE /api/v1/complaints/:id */
export const deleteComplaint = createAsyncThunk(
  "resident-complaints/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/complaints/${id}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err?.response?.data?.message ?? "Failed to delete complaint"
      );
    }
  }
);

/** GET /api/v1/comments/complaint/:complaintId */
export const getCommentsByComplaint = createAsyncThunk(
  "resident-complaints/getCommentsByComplaint",
  async (
    {
      complaintId,
      page = 1,
      limit = 50,
    }: { complaintId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/comments/complaint/${complaintId}`,
        { params: { page, limit } }
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err?.response?.data?.message ?? "Failed to fetch comments"
      );
    }
  }
);

/** POST /api/v1/comments */
export const createComment = createAsyncThunk(
  "resident-complaints/createComment",
  async (
    {
      complaintId,
      userId,
      text,
      image,
    }: {
      complaintId: string;
      userId: string;
      text: string;
      image?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.post("/api/v1/comments", {
        complaintId,
        userId,
        text,
        ...(image ? { image } : {}),
      });
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err?.response?.data?.message ?? "Failed to add comment"
      );
    }
  }
);
