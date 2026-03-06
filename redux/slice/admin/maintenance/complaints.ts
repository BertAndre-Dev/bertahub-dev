import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface ComplaintResident {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ComplaintAddress {
  id?: string;
  _id?: string;
  data?: Record<string, string>;
}

export interface ComplaintItem {
  id: string;
  _id?: string;
  title?: string;
  description: string;
  category?: string;
  status: string;
  priority?: string;
  residentId?: string | ComplaintResident;
  estateId?: string;
  resident?: ComplaintResident;
  addressId?: ComplaintAddress | string;
  ticketNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  image?: string;
}

export interface CommentItem {
  id: string;
  _id?: string;
  complaintId: string;
  userId: string;
  text: string;
  user?: { firstName?: string; lastName?: string };
  createdAt?: string;
  image?: string;
}

/** Normalize estateId so the API always receives a string (backend expects ObjectId string, not a populated object). */
function normalizeEstateId(estateId: string | { _id?: string; id?: string } | undefined): string {
  if (estateId == null) return "";
  if (typeof estateId === "string") return estateId;
  return (estateId as { _id?: string; id?: string })._id ?? (estateId as { _id?: string; id?: string }).id ?? "";
}

/** GET /api/v1/complaints/by-estate */
export const getComplaintsByEstate = createAsyncThunk(
  "complaints/getByEstate",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      search,
    }: { estateId: string | { _id?: string; id?: string }; page?: number; limit?: number; search?: string },
    { rejectWithValue }
  ) => {
    try {
      const id = normalizeEstateId(estateId);
      const params: Record<string, string | number> = { estateId: id, page, limit };
      if (search?.trim()) params.search = search.trim();
      const res = await axiosInstance.get("/api/v1/complaints/by-estate", {
        params,
      });
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
  "complaints/getById",
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

/** PUT /api/v1/complaints/:id/update-status */
export const updateComplaintStatus = createAsyncThunk(
  "complaints/updateStatus",
  async (
    { id, status, notes }: { id: string; status: string; notes?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/complaints/${id}/update-status`,
        { status, notes }
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err?.response?.data?.message ?? "Failed to update status"
      );
    }
  }
);

/** GET /api/v1/comments/complaint/:complaintId */
export const getCommentsByComplaint = createAsyncThunk(
  "complaints/getCommentsByComplaint",
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
  "complaints/createComment",
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
