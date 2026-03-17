import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface MarketplaceItem {
  id?: string;
  companyName?: string;
  productName?: string;
  link?: string;
  productCategory?: string;
  productDescription?: string;
  status?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMarketplacePayload {
  companyName: string;
  productName: string;
  link: string;
  productCategory: string;
  productDescription: string;
}

export interface UpdateMarketplacePayload {
  marketPlaceId: string;
  companyName?: string;
  productName?: string;
  link?: string;
  productCategory?: string;
  productDescription?: string;
}

export interface GetMarketplaceParams {
  page?: number;
  limit?: number;
  status?: string;
  estateId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface MarketplaceListResponse {
  success?: boolean;
  data?: MarketplaceItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** GET /api/v1/marketplace */
export const getMarketplaceList = createAsyncThunk(
  "super-admin-marketplace/getList",
  async (params: GetMarketplaceParams | undefined, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, status, estateId, category, startDate, endDate } =
        params ?? {};
      const res = await axiosInstance.get<MarketplaceListResponse>(
        "/api/v1/marketplace",
        { params: { page, limit, status, estateId, category, startDate, endDate } }
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

/** GET /api/v1/marketplace/{marketPlaceId} */
export const getMarketplaceById = createAsyncThunk(
  "super-admin-marketplace/getById",
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

/** POST /api/v1/marketplace/create */
export const createMarketplace = createAsyncThunk(
  "super-admin-marketplace/create",
  async (payload: CreateMarketplacePayload, { rejectWithValue }) => {
    try {
      const link =
        payload.link.startsWith("http://") ||
        payload.link.startsWith("https://")
          ? payload.link
          : `https://${payload.link}`;
      const res = await axiosInstance.post("/api/v1/marketplace/create", {
        ...payload,
        link,
      });
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      return rejectWithValue({
        message: Array.isArray(msg) ? msg[0] : msg ?? "Failed to create listing",
      });
    }
  }
);

/** PUT /api/v1/marketplace/{marketPlaceId}/update */
export const updateMarketplace = createAsyncThunk(
  "super-admin-marketplace/update",
  async (payload: UpdateMarketplacePayload, { rejectWithValue }) => {
    try {
      const { marketPlaceId, ...body } = payload;
      const link =
        body.link !== undefined
          ? body.link.startsWith("http://") || body.link.startsWith("https://")
            ? body.link
            : `https://${body.link}`
          : undefined;
      const res = await axiosInstance.put(
        `/api/v1/marketplace/${marketPlaceId}/update`,
        link !== undefined ? { ...body, link } : body
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update listing",
      });
    }
  }
);

/** PUT /api/v1/marketplace/{marketPlaceId}/suspend - body: { reason: string } */
export const suspendMarketplace = createAsyncThunk(
  "super-admin-marketplace/suspend",
  async (
    payload: { marketPlaceId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const { marketPlaceId, reason } = payload;
      const res = await axiosInstance.put(
        `/api/v1/marketplace/${marketPlaceId}/suspend`,
        { reason }
      );
      return { ...res.data, marketPlaceId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to suspend listing",
      });
    }
  }
);

/** PUT /api/v1/marketplace/{marketPlaceId}/activate */
export const activateMarketplace = createAsyncThunk(
  "super-admin-marketplace/activate",
  async (marketPlaceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/marketplace/${marketPlaceId}/activate`
      );
      return { ...res.data, marketPlaceId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to activate listing",
      });
    }
  }
);

/** DELETE /api/v1/marketplace/{marketPlaceId} */
export const deleteMarketplace = createAsyncThunk(
  "super-admin-marketplace/delete",
  async (marketPlaceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/marketplace/${marketPlaceId}`
      );
      return { ...res.data, deletedId: marketPlaceId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete listing",
      });
    }
  }
);
