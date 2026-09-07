import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type GetEnergyProviderUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  role?: string;
};

function buildQuery(params: GetEnergyProviderUsersParams) {
  const { page = 1, limit = 10, search, startDate, endDate, role } = params;
  const query = new URLSearchParams();
  if (page != null) query.set("page", String(page));
  if (limit != null) query.set("limit", String(limit));
  query.set("role", (role?.trim() || "resident"));
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
export const getEnergyProviderUsersByEstate = createAsyncThunk(
  "energy-provider-user/getEnergyProviderUsersByEstate",
  async (
    params: GetEnergyProviderUsersParams & {
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
export const getEnergyProviderUsersByCompany = createAsyncThunk(
  "energy-provider-user/getEnergyProviderUsersByCompany",
  async (
    params: GetEnergyProviderUsersParams & {
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
export const getEnergyProviderUser = createAsyncThunk(
  "energy-provider-user/getEnergyProviderUser",
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
export const deleteEnergyProviderUser = createAsyncThunk(
  "energy-provider-user/deleteEnergyProviderUser",
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
export const suspendEnergyProviderUser = createAsyncThunk(
  "energy-provider-user/suspendEnergyProviderUser",
  async (
    payload: { id: string; reason: string },
    { rejectWithValue },
  ) => {
    const id = payload.id?.trim();
    const reason = payload.reason?.trim() ?? "";
    if (!id) {
      return rejectWithValue({ message: "User id is required." });
    }
    if (reason.length < 3) {
      return rejectWithValue({
        message: "A suspension reason of at least 3 characters is required.",
      });
    }
    try {
      const res = await axiosInstance.put(
        `/api/v1/user-mgt/${id}/suspend-user`,
        { reason },
      );
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
export const activateEnergyProviderUser = createAsyncThunk(
  "energy-provider-user/activateEnergyProviderUser",
  async (
    payload: { id: string; note: string },
    { rejectWithValue },
  ) => {
    const id = payload.id?.trim();
    const note = payload.note?.trim() ?? "";
    if (!id) {
      return rejectWithValue({ message: "User id is required." });
    }
    if (note.length < 3) {
      return rejectWithValue({
        message: "An activation note of at least 3 characters is required.",
      });
    }
    try {
      const res = await axiosInstance.put(
        `/api/v1/user-mgt/${id}/activate-user`,
        { note },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to activate user",
      });
    }
  },
);
