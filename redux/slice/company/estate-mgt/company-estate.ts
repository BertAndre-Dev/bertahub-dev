import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export enum VisitorVerificationMode {
  VIEW_AND_VERIFY = "VIEW_AND_VERIFY",
  VERIFY_ONLY = "VERIFY_ONLY",
  VIEW_ONLY = "VIEW_ONLY",
}

export interface EstateData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive?: boolean;
  modules?: string[];
  visitorVerificationMode?: VisitorVerificationMode;
}

export type GetEstatesParams = {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
};

/** GET /api/v1/company-mgt/modules */
export const fetchCompanyEstateModules = createAsyncThunk(
  "company-estate/fetchCompanyEstateModules",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<{ data?: string[] }>(
        "/api/v1/company-mgt/modules",
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to load modules",
      });
    }
  },
);

/** POST /api/v1/estate-mgt */
export const createCompanyEstate = createAsyncThunk(
  "company-estate/createCompanyEstate",
  async (data: EstateData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/estate-mgt", data);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to create estate",
      });
    }
  },
);

/** GET /api/v1/estate-mgt */
export const getCompanyEstates = createAsyncThunk(
  "company-estate/getCompanyEstates",
  async (params: GetEstatesParams | undefined, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search, startDate, endDate } = params ?? {};
      const query = new URLSearchParams();
      if (page != null) query.set("page", String(page));
      if (limit != null) query.set("limit", String(limit));
      if (search?.trim()) query.set("search", search.trim());
      if (startDate) query.set("startDate", startDate);
      if (endDate) query.set("endDate", endDate);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      const res = await axiosInstance.get(`/api/v1/estate-mgt${suffix}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch estates",
      });
    }
  },
);

/** GET /api/v1/estate-mgt/{id} */
export const getCompanyEstateById = createAsyncThunk(
  "company-estate/getCompanyEstateById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/estate-mgt/${id}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch estate",
      });
    }
  },
);

/** PUT /api/v1/estate-mgt/{id} */
export const updateCompanyEstate = createAsyncThunk(
  "company-estate/updateCompanyEstate",
  async (
    { id, data }: { id: string; data: EstateData },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(`/api/v1/estate-mgt/${id}`, data);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update estate",
      });
    }
  },
);

/** DELETE /api/v1/estate-mgt/{id} */
export const deleteCompanyEstate = createAsyncThunk(
  "company-estate/deleteCompanyEstate",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/estate-mgt/${id}`);
      return { ...(res.data as object), deletedId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete estate",
      });
    }
  },
);

/** PUT /api/v1/estate-mgt/{id}/suspend-estate */
export const suspendCompanyEstate = createAsyncThunk(
  "company-estate/suspendCompanyEstate",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/api/v1/estate-mgt/${id}/suspend-estate`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to suspend estate",
      });
    }
  },
);

/** PUT /api/v1/estate-mgt/{id}/activate-estate */
export const activateCompanyEstate = createAsyncThunk(
  "company-estate/activateCompanyEstate",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/api/v1/estate-mgt/${id}/activate-estate`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to activate estate",
      });
    }
  },
);
