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
  addressId?: string;
}

export interface GetVisitorsByResidentParams {
  residentId: string;
  page: number;
  limit: number;
}

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
  async ({ residentId, page = 1, limit = 10 }: GetVisitorsByResidentParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/visitor-mgt?residentId=${residentId}&page=${page}&limit=${limit}`
      );
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
