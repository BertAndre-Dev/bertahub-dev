import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

/** Payload for creating a rent (owner only). POST /api/v1/rent/create */
export interface CreateRentPayload {
  addressId: string;
  tenantId: string;
  amount: number;
  startDate: string; // ISO date e.g. "2026-02-23T00:00:00Z"
  endDate: string;
  notes?: string;
}

/** Params for listing owner rents. GET /api/v1/rent/owner/all */
export interface GetOwnerRentsParams {
  page?: number;
  limit?: number;
}

export interface RentItem {
  id?: string;
  addressId?: string | { id?: string; data?: Record<string, unknown> };
  tenantId?: string | { id?: string; firstName?: string; lastName?: string; email?: string };
  amount?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface RentListResponse {
  success?: boolean;
  message?: string;
  data?: RentItem[];
  pagination?: PaginationMeta;
}

export const createRent = createAsyncThunk(
  "resident-rent-mgt/createRent",
  async (payload: CreateRentPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/rent/create", payload);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to create rent",
      });
    }
  }
);

/** Get all rents for the authenticated owner. GET /api/v1/rent/owner/all */
export const getOwnerRents = createAsyncThunk(
  "resident-rent-mgt/getOwnerRents",
  async (params: GetOwnerRentsParams | undefined, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10 } = params ?? {};
      const res = await axiosInstance.get<RentListResponse>(
        "/api/v1/rent/owner/all",
        { params: { page, limit } }
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch rents",
      });
    }
  }
);

/** Get a single rent by ID. GET /api/v1/rent/{rentId} */
export const getRentById = createAsyncThunk(
  "resident-rent-mgt/getRentById",
  async (rentId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/rent/${rentId}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch rent",
      });
    }
  }
);
