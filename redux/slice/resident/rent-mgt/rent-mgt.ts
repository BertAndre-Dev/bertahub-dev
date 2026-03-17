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
  startDate?: string;
  endDate?: string;
}

export interface RentItem {
  id?: string;
  addressId?: string | { id?: string; data?: Record<string, unknown> };
  tenantId?: string | { id?: string; firstName?: string; lastName?: string; email?: string };
  amount?: number;
  amountPaid?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  status?: string; // e.g. "active" | "suspended"
  createdAt?: string;
  updatedAt?: string;
}

/** Payload for updating a rent. PUT /api/v1/rent/:rentId/update */
export interface UpdateRentPayload {
  id: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
  currency?: string;
  notes?: string;
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
      const { page = 1, limit = 10, startDate, endDate } = params ?? {};
      const res = await axiosInstance.get<RentListResponse>(
        "/api/v1/rent/owner/all",
        { params: { page, limit, startDate, endDate } }
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

/** Params for listing tenant rents. GET /api/v1/rent/tenant/all */
export interface GetTenantRentsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

/** Get all rents for the authenticated tenant. GET /api/v1/rent/tenant/all */
export const getTenantRents = createAsyncThunk(
  "resident-rent-mgt/getTenantRents",
  async (params: GetTenantRentsParams | undefined, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, startDate, endDate } = params ?? {};
      const res = await axiosInstance.get<RentListResponse>(
        "/api/v1/rent/tenant/all",
        { params: { page, limit, startDate, endDate } }
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

/** Pay rent. POST /api/v1/rent/pay */
export interface PayRentPayload {
  rentId: string;
  amount: number;
  paymentMethod: string;
  reference: string;
}

export const payRent = createAsyncThunk(
  "resident-rent-mgt/payRent",
  async (payload: PayRentPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/rent/pay", payload);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to pay rent",
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

/** Delete a rent. DELETE /api/v1/rent/:rentId/delete */
export const deleteRent = createAsyncThunk(
  "resident-rent-mgt/deleteRent",
  async (rentId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/rent/${rentId}/delete`);
      return { ...res.data, deletedId: rentId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete rent",
      });
    }
  }
);

/** Update a rent. PUT /api/v1/rent/:rentId/update */
export const updateRent = createAsyncThunk(
  "resident-rent-mgt/updateRent",
  async (payload: UpdateRentPayload, { rejectWithValue }) => {
    try {
      const { id, ...body } = payload;
      const res = await axiosInstance.put(`/api/v1/rent/${id}/update`, body);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update rent",
      });
    }
  }
);

/** Activate a rent. PUT /api/v1/rent/:id/activate */
export const activateRent = createAsyncThunk(
  "resident-rent-mgt/activateRent",
  async (rentId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/api/v1/rent/${rentId}/activate`);
      return { ...res.data, rentId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to activate rent",
      });
    }
  }
);

/** Suspend a rent. PUT /api/v1/rent/:rentId/suspend with body { reason } */
export const suspendRent = createAsyncThunk(
  "resident-rent-mgt/suspendRent",
  async (
    { rentId, reason }: { rentId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/rent/${rentId}/suspend`,
        { reason: reason?.trim() || "Suspended by owner" }
      );
      return { ...res.data, rentId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to suspend rent",
      });
    }
  }
);
