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
            limit = 10,
            page = 1,
        }: { page?: number; limit?: number},
        { rejectWithValue }
    ) => {
        try {
            const res = await axiosInstance.get(
                `/api/v1/meters?${limit}${page}`
            );
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);;
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