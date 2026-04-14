import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type UpdateUserProfilePayload = {
  id: string;
  data: {
    firstName: string;
    lastName: string;
    email: string;
    countryCode: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber: string;
    role?: string;
    image?: string;
  };
};

export const getUserProfile = createAsyncThunk(
  "user-profile/getUserProfile",
  async (id: string, { rejectWithValue }) => {
    // ✅ Hard stop — never let an empty string reach the API
    if (!id || !/^[a-f\d]{24}$/i.test(id.trim())) {
      return rejectWithValue({ message: "Invalid user ID — cannot fetch profile" });
    }
    try {
      const res = await axiosInstance.get(`/api/v1/user-mgt/${id.trim()}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || "Failed to fetch user profile",
      });
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  "user-profile/updateUserProfile",
  async ({ id, data }: UpdateUserProfilePayload, { rejectWithValue }) => {
    // ✅ Same guard on update
    if (!id || !/^[a-f\d]{24}$/i.test(id.trim())) {
      return rejectWithValue({ message: "Invalid user ID — cannot update profile" });
    }
    try {
      const res = await axiosInstance.put(`/api/v1/user-mgt/${id.trim()}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || "Failed to update user profile",
      });
    }
  },
);