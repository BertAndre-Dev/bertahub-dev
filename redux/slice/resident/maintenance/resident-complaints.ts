import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export const getComplaintsByAddress = createAsyncThunk(
  "resident-complaints/getComplaintsByAddress",
  async (
    {
      addressId,
      page = 1,
      limit = 10,
    }: { addressId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/complaints/by-address/${addressId}?page=${page}&limit=${limit}`
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getComplaintsByAddresses = createAsyncThunk(
  "resident-complaints/getComplaintsByAddresses",
  async (
    {
      addressIds,
      page = 1,
      limit = 20,
    }: { addressIds: string[]; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      if (!addressIds?.length) {
        return {
          success: true,
          message: "No addresses",
          data: [],
          pagination: { total: 0, page: 1, limit, pages: 1 },
        };
      }
      const results = await Promise.all(
        addressIds.map((addressId) =>
          axiosInstance
            .get(
              `/api/v1/complaints/by-address/${addressId}?page=1&limit=${limit}`
            )
            .then((r) => r.data?.data ?? [])
        )
      );
      const merged = results.flat();
      const sorted = [...merged].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
      return {
        success: true,
        message: "Complaints retrieved",
        data: sorted,
        pagination: {
          total: sorted.length,
          page: 1,
          limit: sorted.length,
          pages: 1,
        },
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getComplaintById = createAsyncThunk(
  "resident-complaints/getComplaintById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/complaints/${id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

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

export const createComplaint = createAsyncThunk(
  "resident-complaints/createComplaint",
  async (payload: CreateComplaintPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/complaints", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getCommentsByComplaint = createAsyncThunk(
  "resident-complaints/getCommentsByComplaint",
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
        ...(image && { image }),
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);
