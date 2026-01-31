import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

/**
 * Get all bills paid by residents in the estate.
 * GET /api/v1/transaction-mgt/estate-bills/{estateId}
 */
export const getEstateBills = createAsyncThunk(
  "estate-admin-estate-bills/getEstateBills",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
    }: { estateId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      const query = params.toString();
      const base = `/api/v1/transaction-mgt/estate-bills/${estateId}`;
      const url = query ? `${base}?${query}` : base;
      const res = await axiosInstance.get(url);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch estate bills",
      });
    }
  }
);
