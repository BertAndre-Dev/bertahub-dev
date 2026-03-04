import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

/** GET /analytics/complaints/dashboard?estateId=... */
export const getComplaintsDashboard = createAsyncThunk(
  "complaints/getComplaintsDashboard",
  async (estateId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        "/analytics/complaints/dashboard",
        { params: { estateId } }
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getComplaintsByEstate = createAsyncThunk(
  "complaints/getComplaintsByEstate",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      search,
    }: {
      estateId: string;
      page?: number;
      limit?: number;
      search?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      params.set("estateId", estateId);
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      const res = await axiosInstance.get(
        `/api/v1/complaints/by-estate?${params.toString()}`
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getComplaintById = createAsyncThunk(
  "complaints/getComplaintById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/complaints/${id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateComplaintStatus = createAsyncThunk(
  "complaints/updateComplaintStatus",
  async (
    {
      id,
      status,
      notes,
    }: { id: string; status: string; notes?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/complaints/${id}/update-status`,
        { status, notes }
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getCommentsByComplaint = createAsyncThunk(
  "complaints/getCommentsByComplaint",
  async (
    {
      complaintId,
      page = 1,
      limit = 20,
    }: { complaintId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/comments/complaint/${complaintId}?page=${page}&limit=${limit}`
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

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
        ...(image && { image }),
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);
