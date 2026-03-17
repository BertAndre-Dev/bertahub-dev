import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

interface VisitorData {
  visitorCode: string;
};

interface GetVisitorDetailsParams {
  code: string;
}


export const verifyVisitor = createAsyncThunk(
  "visitor/verifyVisitor",
  async (data: VisitorData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put("/api/v1/visitor-mgt/verify-code", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// Delete visitor (admin)
export const deleteVisitor = createAsyncThunk(
  "visitor/deleteVisitor",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/visitor-mgt/${id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete visitor" },
      );
    }
  },
);


export const getVisitorsByEstate = createAsyncThunk(
  "visitor/getVisitorsByEstate",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: {
      estateId: string;
      page: number;
      limit: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString();
      const suffix = query ? "?" + query : "";
      const res = await axiosInstance.get(
        `/api/v1/visitor-mgt/all-visitors/${estateId}` + suffix
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);


export const getVisitorDetailsByCode = createAsyncThunk(
  "visitor/getVisitorDetailsByCode",
  async ({ code }: GetVisitorDetailsParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/visitor-mgt/view-details`,
        {
          params: { code },
        }
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);
