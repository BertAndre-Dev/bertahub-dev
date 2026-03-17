import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

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
    }: {
      estateId: string | { id?: string; _id?: string };
      page?: number;
      limit?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const normalizedEstateId =
        typeof estateId === "string"
          ? estateId
          : estateId?._id || estateId?.id || "";

      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      if (search?.trim()) params.set("search", search.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString();
      const suffix = query ? "?" + query : "";
      const res = await axiosInstance.get(
        `/api/v1/user-mgt/estate/${normalizedEstateId}` + suffix,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || "Failed to fetch users",
      });
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
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
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
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
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
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
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
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  },
);
