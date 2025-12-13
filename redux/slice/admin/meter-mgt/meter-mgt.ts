import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";


interface AdminMeterData {
    meterNumber: string;
    estateId: string;
    addressId: string;
};


export const assignMeterToAddress = createAsyncThunk(
    "meter/assignMeterToAddress",
    async (data: AdminMeterData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post("/api/v1/meters/assign-meter-to-address", data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


export const getAllEstateMeter = createAsyncThunk(
    "meter-mgt/getAllEstateMeter",
    async (
        {
            estateId,
            page = 1,
            limit = 10,
            search = ""
        }: { estateId: string; page?: number; limit?: number; search?: string;},
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
                `/api/v1/meters/estate/${estateId}?${params.toString()}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);
        }
    }
);


export const getMeter = createAsyncThunk(
    "meter/getMeter",
    async (meterId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/meters/${meterId}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);



