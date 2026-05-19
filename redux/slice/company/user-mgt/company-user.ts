import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type GetCompanyUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
};

function buildQuery(params: GetCompanyUsersParams) {
  const { page = 1, limit = 10, search, startDate, endDate } = params;
  const query = new URLSearchParams();
  if (page != null) query.set("page", String(page));
  if (limit != null) query.set("limit", String(limit));
  if (search?.trim()) query.set("search", search.trim());
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

function normalizeId(
  id: string | { id?: string; _id?: string } | undefined,
): string {
  if (!id) return "";
  if (typeof id === "string") return id.trim();
  return String(id._id || id.id || "").trim();
}

/** GET /api/v1/user-mgt/estate/{estateId} */
export const getCompanyUsersByEstate = createAsyncThunk(
  "company-user/getCompanyUsersByEstate",
  async (
    params: GetCompanyUsersParams & {
      estateId: string | { id?: string; _id?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const estateIdValue = normalizeId(params.estateId);
      if (!estateIdValue) {
        return rejectWithValue({ message: "Please select a valid estate." });
      }
      const res = await axiosInstance.get(
        `/api/v1/user-mgt/estate/${estateIdValue}${buildQuery(params)}`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch users",
      });
    }
  },
);

/** GET /api/v1/user-mgt/company/{companyId} */
export const getCompanyUsersByCompany = createAsyncThunk(
  "company-user/getCompanyUsersByCompany",
  async (
    params: GetCompanyUsersParams & {
      companyId: string | { id?: string; _id?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const companyIdValue = normalizeId(params.companyId);
      if (!companyIdValue) {
        return rejectWithValue({ message: "Please select a valid company." });
      }
      const res = await axiosInstance.get(
        `/api/v1/user-mgt/company/${companyIdValue}${buildQuery(params)}`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch users",
      });
    }
  },
);

/** GET /api/v1/user-mgt/{id} */
export const getCompanyUser = createAsyncThunk(
  "company-user/getCompanyUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/user-mgt/${id}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch user",
      });
    }
  },
);

/** DELETE /api/v1/user-mgt/{id} */
export const deleteCompanyUser = createAsyncThunk(
  "company-user/deleteCompanyUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/user-mgt/${id}`);
      return { ...(res.data as object), deletedId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete user",
      });
    }
  },
);

/** PUT /api/v1/user-mgt/{id}/suspend-user */
export const suspendCompanyUser = createAsyncThunk(
  "company-user/suspendCompanyUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/api/v1/user-mgt/${id}/suspend-user`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to suspend user",
      });
    }
  },
);

/** PUT /api/v1/user-mgt/{id}/activate-user */
export const activateCompanyUser = createAsyncThunk(
  "company-user/activateCompanyUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/api/v1/user-mgt/${id}/activate-user`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to activate user",
      });
    }
  },
);
