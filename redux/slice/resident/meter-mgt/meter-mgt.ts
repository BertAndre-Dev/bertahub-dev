import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

interface VendData {
    meterNumber: string;
    amount: number;
    walletId: string;
};


interface ResidentMeterData {
    meterNumber: string;
};



export const getMeterByAddress = createAsyncThunk(
    "meter-mgt/getMeterByAddress",
    async (
        {
            addressId,
        }: { addressId: string},
        { rejectWithValue }
    ) => {
        try {
            const res = await axiosInstance.get(
                `/api/v1/meters/address/${addressId}`
            );
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);
        }
    }
);


export const vendPower = createAsyncThunk(
    "meter-mgt/vendPower",
    async (data: VendData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post("/api/v1/meters/vend/trial", data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);
        }
    }
);


export const disconnectMeter = createAsyncThunk(
  "meter-mgt/disconnectMeter",
  async (data: ResidentMeterData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/meters/disconnect-meter", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);


export const reconnectMeter = createAsyncThunk(
  "meter-mgt/reconnectMeter",
  async (data: ResidentMeterData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/meters/reconnect-meter", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);