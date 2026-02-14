import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type UpdateEstateProfilePayload = {
  id: string;
  data: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    isActive: boolean;
  };
};

export const getEstateProfile = createAsyncThunk(
  "estate-profile/getEstateProfile",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/estate-mgt/${id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch estate profile",
      });
    }
  },
);

export const updateEstateProfile = createAsyncThunk(
  "estate-profile/updateEstateProfile",
  async ({ id, data }: UpdateEstateProfilePayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/api/v1/estate-mgt/${id}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to update estate profile",
      });
    }
  },
);
