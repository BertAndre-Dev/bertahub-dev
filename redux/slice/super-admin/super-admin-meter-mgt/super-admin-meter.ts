import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";


interface SuperAdminMeterData {
    meterNumber: string;
    estateId: string;
};


export const assignMeterToEstate = createAsyncThunk(
  "super-admin-meter/assignMeterToEstate",
  async (data: SuperAdminMeterData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/meters/add-meter", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);



export const removeEstateMeter = createAsyncThunk(
    "super-admin-meter/removeEstateMeter",
    async (data: SuperAdminMeterData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put("/api/v1/meters/remove-estate-meter", data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);
        }
    }
);


export const reAssignMeter = createAsyncThunk(
    "super-admin-meter/reAssignMeter",
    async (data: SuperAdminMeterData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put("/api/v1/meters/reassign-meter", data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);
        }
    }
);


export const getAllMeters = createAsyncThunk(
  "super-admin-meter/getAllMeters",
  async (
    {
      page = 1,
      limit = 10,
      search = "",
    }: {
      page: number;
      limit: number;
      search?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();

      params.append("page", String(page));
      params.append("limit", String(limit));

      if (search) {
        params.append("search", search);
      }

      const res = await axiosInstance.get(
        `/api/v1/meters?${params.toString()}`
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);



export const getMeter = createAsyncThunk(
    "super-admin-meter/getMeter",
    async (meterId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/meters/${meterId}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);;
        }
    }
);

/** Get a single meter by its address ID (for View details). */
export const getMeterByAddressId = createAsyncThunk(
  "super-admin-meter/getMeterByAddressId",
  async (addressId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/meters/address/${addressId}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data ?? { message: "Failed to fetch meter details" });
    }
  }
);


export const deleteMeter = createAsyncThunk(
  "super-admin-meter/deleteMeter",
  async (meterId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/meters/${meterId}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
)