import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface ResidentMarketplaceItem {
  id?: string;
  companyName?: string;
  productName?: string;
  link?: string;
  productCategory?: string;
  productDescription?: string;
  status?: string;
  isSuspended?: boolean;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GetResidentMarketplaceParams {
  page?: number;
  limit?: number;
  status?: string;
  estateId?: string;
  category?: string;
}

export interface ResidentMarketplaceListResponse {
  success?: boolean;
  data?: ResidentMarketplaceItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** GET /api/v1/marketplace - same API as super-admin, resident read-only list */
export const getResidentMarketplaceList = createAsyncThunk(
  "resident-marketplace/getList",
  async (params: GetResidentMarketplaceParams | undefined, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 50, status, estateId, category } = params ?? {};
      const res = await axiosInstance.get<ResidentMarketplaceListResponse>(
        "/api/v1/marketplace",
        { params: { page, limit, status, estateId, category } }
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch marketplace",
      });
    }
  }
);

/** GET /api/v1/marketplace/:id - view single listing */
export const getResidentMarketplaceById = createAsyncThunk(
  "resident-marketplace/getById",
  async (marketPlaceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/marketplace/${marketPlaceId}`
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch listing",
      });
    }
  }
);
