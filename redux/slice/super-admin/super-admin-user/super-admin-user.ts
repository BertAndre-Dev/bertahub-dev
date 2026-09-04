import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";
import { withE164PhoneNumber } from "@/lib/phone-e164";

// get all users by estate (with pagination)
export const getAllUsersByEstate = createAsyncThunk(
  "super-admin-user/getAllUsersByEstate",
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
      const normalizedEstateId =
        typeof estateId === "string"
          ? estateId
          : estateId?._id || estateId?.id || "";
      const estateIdValue = String(normalizedEstateId).trim();
      if (!estateIdValue) {
        return rejectWithValue({
          message: "Please select a valid estate.",
        });
      }

      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      params.set("role", role?.trim() || "resident");
      if (search?.trim()) params.set("search", search.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString();
      const suffix = query ? "?" + query : "";
      const res = await axiosInstance.get(
        `/api/v1/user-mgt/estate/${estateIdValue}` + suffix,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// get all users by company (with pagination)
export const getAllUsersByCompany = createAsyncThunk(
  "super-admin-user/getAllUsersByCompany",
  async (
    {
      companyId,
      page = 1,
      limit = 10,
      search,
      startDate,
      endDate,
      role,
    }: {
      companyId: string | { id?: string; _id?: string };
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
      const normalizedCompanyId =
        typeof companyId === "string"
          ? companyId
          : companyId?._id || companyId?.id || "";
      const companyIdValue = String(normalizedCompanyId).trim();
      if (!companyIdValue) {
        return rejectWithValue({
          message: "Please select a valid company.",
        });
      }

      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      params.set("role", role?.trim() || "resident");
      if (search?.trim()) params.set("search", search.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString();
      const suffix = query ? "?" + query : "";

      // NOTE: mirrors estate endpoint shape
      const res = await axiosInstance.get(
        `/api/v1/user-mgt/company/${companyIdValue}` + suffix,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// get individual user
export const getUser = createAsyncThunk(
  "super-admin-user/getUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/user-mgt/${id}`);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// delete an user
export const deleteUser = createAsyncThunk(
  "super-admin-user/deleteUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/user-mgt/${id}`);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// suspend an user
export const suspendUser = createAsyncThunk(
  "super-admin-user/suspendUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/user-mgt/${id}/suspend-user`,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// activate an user
export const activateUser = createAsyncThunk(
  "super-admin-user/activateUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/user-mgt/${id}/activate-user`,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export type UpdateUserPayload = {
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
  "super-admin-user/updateUser",
  async ({ id, data }: UpdateUserPayload, { rejectWithValue }) => {
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
