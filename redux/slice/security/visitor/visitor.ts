import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export const getAllVisitors = createAsyncThunk(
  "securityVisitor/getAllVisitors",
  async (
    { estateId, page = 1, limit = 10 }: { estateId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/visitor-mgt/all-visitors/${estateId}?page=${page}&limit=${limit}`
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);
