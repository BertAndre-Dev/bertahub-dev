import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface CompanyMarketplaceItem {
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

export interface CreateCompanyMarketplacePayload {
  companyName: string;
  productName: string;
  link: string;
  productCategory: string;
  productDescription: string;
}

export interface UpdateCompanyMarketplacePayload {
  marketPlaceId: string;
  companyName?: string;
  productName?: string;
  link?: string;
  productCategory?: string;
  productDescription?: string;
}

export interface GetCompanyMarketplaceParams {
  page?: number;
  limit?: number;
  status?: string;
  estateId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface CompanyMarketplaceListResponse {
  success?: boolean;
  data?: CompanyMarketplaceItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** GET /api/v1/marketplace */
export const getCompanyMarketplaceList = createAsyncThunk(
  "company-marketplace/getList",
  async (
    params: GetCompanyMarketplaceParams | undefined,
    { rejectWithValue },
  ) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        estateId,
        category,
        startDate,
        endDate,
      } = params ?? {};
      const res = await axiosInstance.get<CompanyMarketplaceListResponse>(
        "/api/v1/marketplace",
        { params: { page, limit, status, estateId, category, startDate, endDate } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch marketplace",
      });
    }
  },
);

/** GET /api/v1/marketplace/{marketPlaceId} */
export const getCompanyMarketplaceById = createAsyncThunk(
  "company-marketplace/getById",
  async (marketPlaceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/marketplace/${marketPlaceId}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch listing",
      });
    }
  },
);

/** POST /api/v1/marketplace/create */
export const createCompanyMarketplace = createAsyncThunk(
  "company-marketplace/create",
  async (payload: CreateCompanyMarketplacePayload, { rejectWithValue }) => {
    try {
      const link =
        payload.link.startsWith("http://") || payload.link.startsWith("https://")
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
  },
);

/** PUT /api/v1/marketplace/{marketPlaceId}/update */
export const updateCompanyMarketplace = createAsyncThunk(
  "company-marketplace/update",
  async (payload: UpdateCompanyMarketplacePayload, { rejectWithValue }) => {
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
        link !== undefined ? { ...body, link } : body,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update listing",
      });
    }
  },
);

/** PUT /api/v1/marketplace/{marketPlaceId}/suspend - body: { reason: string } */
export const suspendCompanyMarketplace = createAsyncThunk(
  "company-marketplace/suspend",
  async (
    payload: { marketPlaceId: string; reason: string },
    { rejectWithValue },
  ) => {
    try {
      const { marketPlaceId, reason } = payload;
      const res = await axiosInstance.put(
        `/api/v1/marketplace/${marketPlaceId}/suspend`,
        { reason },
      );
      return { ...res.data, marketPlaceId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to suspend listing",
      });
    }
  },
);

/** PUT /api/v1/marketplace/{marketPlaceId}/activate */
export const activateCompanyMarketplace = createAsyncThunk(
  "company-marketplace/activate",
  async (marketPlaceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/marketplace/${marketPlaceId}/activate`,
      );
      return { ...res.data, marketPlaceId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to activate listing",
      });
    }
  },
);

/** DELETE /api/v1/marketplace/{marketPlaceId} */
export const deleteCompanyMarketplace = createAsyncThunk(
  "company-marketplace/delete",
  async (marketPlaceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/marketplace/${marketPlaceId}`);
      return { ...res.data, deletedId: marketPlaceId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete listing",
      });
    }
  },
);

