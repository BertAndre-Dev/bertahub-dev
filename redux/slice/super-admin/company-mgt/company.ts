import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type CompanyModuleKey = string;

export interface CompanyItem {
  id?: string;
  _id?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
  modules?: CompanyModuleKey[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyListResponse {
  success?: boolean;
  message?: string;
  data?: CompanyItem[];
  pagination?: {
    total: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
}

export interface GetCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateCompanyPayload {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  modules: CompanyModuleKey[];
}

export interface UpdateCompanyPayload {
  id: string;
  data: Partial<CreateCompanyPayload>;
}

export interface UpdateCompanyModulesPayload {
  id: string;
  modules: CompanyModuleKey[];
}

function toCompanyId(company: CompanyItem | null | undefined): string | null {
  return company?.id ?? company?._id ?? null;
}

/** GET /api/v1/company-mgt */
export const getCompanies = createAsyncThunk(
  "super-admin-company/getCompanies",
  async (params: GetCompaniesParams | undefined, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search, startDate, endDate } = params ?? {};
      const res = await axiosInstance.get<CompanyListResponse>("/api/v1/company-mgt", {
        params: { page, limit, search, startDate, endDate },
      });
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch companies",
      });
    }
  },
);

/** GET /api/v1/company-mgt/{id} */
export const getCompanyById = createAsyncThunk(
  "super-admin-company/getCompanyById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/company-mgt/${id}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch company",
      });
    }
  },
);

/** GET /api/v1/company-mgt/modules */
export const getCompanyModules = createAsyncThunk(
  "super-admin-company/getCompanyModules",
  async (_: void, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/api/v1/company-mgt/modules");
      return res.data as { success?: boolean; message?: string; data?: CompanyModuleKey[] };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch company modules",
      });
    }
  },
);

/** POST /api/v1/company-mgt */
export const createCompany = createAsyncThunk(
  "super-admin-company/createCompany",
  async (payload: CreateCompanyPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/company-mgt", payload);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      return rejectWithValue({
        message: Array.isArray(msg) ? msg[0] : msg ?? "Failed to create company",
      });
    }
  },
);

/** PUT /api/v1/company-mgt/{id} */
export const updateCompany = createAsyncThunk(
  "super-admin-company/updateCompany",
  async (payload: UpdateCompanyPayload, { rejectWithValue }) => {
    try {
      const { id, data } = payload;
      const res = await axiosInstance.put(`/api/v1/company-mgt/${id}`, data);
      return { ...res.data, updatedId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update company",
      });
    }
  },
);

/** PUT /api/v1/company-mgt/{id}/modules */
export const updateCompanyModules = createAsyncThunk(
  "super-admin-company/updateCompanyModules",
  async (payload: UpdateCompanyModulesPayload, { rejectWithValue }) => {
    try {
      const { id, modules } = payload;
      const res = await axiosInstance.put(`/api/v1/company-mgt/${id}/modules`, { modules });
      return { ...res.data, updatedId: id, modules };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update company modules",
      });
    }
  },
);

/** PUT /api/v1/company-mgt/{id}/suspend-company */
export const suspendCompany = createAsyncThunk(
  "super-admin-company/suspendCompany",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/api/v1/company-mgt/${id}/suspend-company`);
      return { ...res.data, companyId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to suspend company",
      });
    }
  },
);

/** PUT /api/v1/company-mgt/{id}/activate-company */
export const activateCompany = createAsyncThunk(
  "super-admin-company/activateCompany",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/api/v1/company-mgt/${id}/activate-company`);
      return { ...res.data, companyId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to activate company",
      });
    }
  },
);

/** DELETE /api/v1/company-mgt/{id} */
export const deleteCompany = createAsyncThunk(
  "super-admin-company/deleteCompany",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/company-mgt/${id}`);
      return { ...res.data, deletedId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete company",
      });
    }
  },
);

export const companyUtils = { toCompanyId };

