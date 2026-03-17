import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

// Visitor management thunks for resident

export interface CreateVisitorData {
  firstName: string;
  lastName: string;
  phone: string;
  purpose: string;
  residentId: string;
  estateId: string;
  addressId: string;
}

export interface UpdateVisitorData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  purpose?: string;
  residentId?: string;
  estateId?: string;
  addressId?: string;
}

export interface GetVisitorsByResidentParams {
  residentId: string;
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
}

// Delete visitor
export const deleteVisitor = createAsyncThunk(
  "residentVisitor/deleteVisitor",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/visitor-mgt/${id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete visitor" },
      );
    }
  },
);

// Create visitor
export const createVisitor = createAsyncThunk(
  "residentVisitor/createVisitor",
  async (data: CreateVisitorData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/visitor-mgt", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed to create visitor" });
    }
  }
);

// Get all visitors by resident
export const getVisitorsByResident = createAsyncThunk(
  "residentVisitor/getVisitorsByResident",
  async (
    { residentId, page = 1, limit = 10, startDate, endDate }: GetVisitorsByResidentParams,
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      params.set("residentId", residentId);
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await axiosInstance.get(`/api/v1/visitor-mgt?${params.toString()}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed to fetch visitors" });
    }
  }
);

// Get single visitor by ID
export const getVisitorById = createAsyncThunk(
  "residentVisitor/getVisitorById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/visitor-mgt/${id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed to fetch visitor" });
    }
  }
);

// Update visitor
export const updateVisitor = createAsyncThunk(
  "residentVisitor/updateVisitor",
  async ({ id, data }: { id: string; data: UpdateVisitorData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/api/v1/visitor-mgt/${id}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed to update visitor" });
    }
  }
);
