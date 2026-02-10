import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export const generateTxRef = createAsyncThunk(
  "estate-admin-payment/generateTxRef",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        "/api/v1/payment-mgt/generate-tx-ref",
        {
          params: {
            prefix: "tx_ref",
          },
        }
      );

      // return only what you need
      return res.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate transaction reference"
      );
    }
  }
);
