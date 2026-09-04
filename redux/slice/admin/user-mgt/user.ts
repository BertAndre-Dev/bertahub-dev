import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue, getApiErrorMessage } from "@/lib/api-error";
import { withE164PhoneNumber } from "@/lib/phone-e164";

// get all users by estate (with search)
export const getAllUsersByEstate = createAsyncThunk(
  "admin-user/getAllUsersByEstate",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      search,
      startDate,
      endDate,
      role,
    }: {
      estateId: string | { id?: string; _id?: string };
      page?: number;
      limit?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
      role?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        role: role?.trim() || "resident",
      });
      if (search && search.trim()) {
        params.append("search", search.trim());
      }
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const normalizedEstateId =
        typeof estateId === "string"
          ? estateId
          : estateId?._id || estateId?.id || "";

      const res = await axiosInstance.get(
        `/api/v1/user-mgt/estate/${normalizedEstateId}?${params.toString()}`,
      );

      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Unable to fetch users",
      });
    }
  },
);

// get individual user
export const getUser = createAsyncThunk(
  "admin-user/getUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/user-mgt/${id}`);
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to fetch user",
      });
    }
  },
);

// delete an user
export const deleteUser = createAsyncThunk(
  "admin-user/deleteUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/user-mgt/${id}`);
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to delete user",
      });
    }
  },
);

// suspend an user
export const suspendUser = createAsyncThunk(
  "admin-user/suspendUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/user-mgt/${id}/suspend-user`,
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to suspend user",
      });
    }
  },
);

// activate an user
export const activateUser = createAsyncThunk(
  "admin-user/activateUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/user-mgt/${id}/activate-user`,
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to activate user",
      });
    }
  },
);

export type UpdateAdminUserPayload = {
  id: string;
  data: {
    firstName: string;
    lastName: string;
    email: string;
    countryCode?: string;
    dateOfBirth?: string;
    gender?: string;
    phoneNumber?: string;
    address?: string;
    addressIds?: string[];
    role?: string;
    image?: string;
    residentType?: string | null;
  };
};

/** PUT /api/v1/user-mgt/{id} — update user details */
export const updateUser = createAsyncThunk(
  "admin-user/updateUser",
  async ({ id, data }: UpdateAdminUserPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/user-mgt/${id}`,
        withE164PhoneNumber(data),
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
