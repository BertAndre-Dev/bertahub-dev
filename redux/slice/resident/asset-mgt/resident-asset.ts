import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type ApiPagination = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
};

export type AssetCategory = {
  id?: string;
  _id?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Asset = {
  id?: string;
  _id?: string;
  name?: string;
  tag?: string;
  assetCategoryId?: string | AssetCategory;
  estateId?: string | { id?: string; _id?: string; name?: string };
  companyId?: string;
  amount?: number;
  useFullLife?: number;
  datePurchased?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AssetCategoryListResponse = {
  success?: boolean;
  message?: string;
  data?: AssetCategory[];
  pagination?: ApiPagination;
};

export type AssetListResponse = {
  success?: boolean;
  message?: string;
  data?: Asset[];
  pagination?: ApiPagination;
};

export type GetListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type GetAssetsParams = GetListParams & {
  estateId: string;
};

export type CreateAssetCategoryPayload = { name: string };
export type UpdateAssetCategoryPayload = { id: string; name: string };

export type CreateAssetItemPayload = {
  name: string;
  tag: string;
  assetCategoryId: string;
  estateId: string;
  amount: number;
  useFullLife: number;
  datePurchased: string;
};

export type CreateAssetsPayload = {
  assets: CreateAssetItemPayload[];
};

export type UpdateAssetPayload = {
  id: string;
  name?: string;
  tag?: string;
  assetCategoryId?: string;
  estateId?: string;
  amount?: number;
  useFullLife?: number;
  datePurchased?: string;
};

const normalizeId = (id: string | undefined) => id ?? "";

/** POST /api/v1/asset-categories */
export const createAssetCategory = createAsyncThunk(
  "resident-asset/createAssetCategory",
  async (payload: CreateAssetCategoryPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/asset-categories", payload);
      return res.data as { success?: boolean; message?: string; data?: AssetCategory };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      return rejectWithValue({
        message: Array.isArray(msg) ? msg[0] : msg ?? "Failed to create asset category",
      });
    }
  },
);

/** GET /api/v1/asset-categories */
export const getAssetCategories = createAsyncThunk(
  "resident-asset/getAssetCategories",
  async (params: GetListParams | undefined, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search } = params ?? {};
      const res = await axiosInstance.get<AssetCategoryListResponse>(
        "/api/v1/asset-categories",
        { params: { page, limit, search: search?.trim() || undefined } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch asset categories",
      });
    }
  },
);

/** PUT /api/v1/asset-categories/{id} */
export const updateAssetCategory = createAsyncThunk(
  "resident-asset/updateAssetCategory",
  async (payload: UpdateAssetCategoryPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/asset-categories/${normalizeId(payload.id)}`,
        { name: payload.name },
      );
      return { ...(res.data as object), id: payload.id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update asset category",
      });
    }
  },
);

/** DELETE /api/v1/asset-categories/{id} */
export const deleteAssetCategory = createAsyncThunk(
  "resident-asset/deleteAssetCategory",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/asset-categories/${normalizeId(id)}`);
      return { ...(res.data as object), deletedId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete asset category",
      });
    }
  },
);

/** POST /api/v1/assets  (body: { assets: [...] }) */
export const createAssets = createAsyncThunk(
  "resident-asset/createAssets",
  async (payload: CreateAssetsPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/assets", payload);
      return res.data as { success?: boolean; message?: string; data?: Asset | Asset[] };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      return rejectWithValue({
        message: Array.isArray(msg) ? msg[0] : msg ?? "Failed to create asset(s)",
      });
    }
  },
);

/** GET /api/v1/assets?estateId=... */
export const getAssets = createAsyncThunk(
  "resident-asset/getAssets",
  async (params: GetAssetsParams, { rejectWithValue }) => {
    try {
      const { estateId, page = 1, limit = 10, search } = params;
      const estateIdValue = normalizeId(estateId).trim();
      if (!estateIdValue) {
        return rejectWithValue({ message: "Estate is required to load assets." });
      }
      const res = await axiosInstance.get<AssetListResponse>("/api/v1/assets", {
        params: {
          estateId: estateIdValue,
          page,
          limit,
          search: search?.trim() || undefined,
        },
      });
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch assets",
      });
    }
  },
);

/** GET /api/v1/assets/{id} */
export const getAssetById = createAsyncThunk(
  "resident-asset/getAssetById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/assets/${normalizeId(id)}`);
      return res.data as { success?: boolean; message?: string; data?: Asset };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch asset",
      });
    }
  },
);

/** PUT /api/v1/assets/{id} */
export const updateAsset = createAsyncThunk(
  "resident-asset/updateAsset",
  async (payload: UpdateAssetPayload, { rejectWithValue }) => {
    try {
      const { id, ...body } = payload;
      const res = await axiosInstance.put(`/api/v1/assets/${normalizeId(id)}`, body);
      return { ...(res.data as object), id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update asset",
      });
    }
  },
);

/** DELETE /api/v1/assets/{id} */
export const deleteAsset = createAsyncThunk(
  "resident-asset/deleteAsset",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/assets/${normalizeId(id)}`);
      return { ...(res.data as object), deletedId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete asset",
      });
    }
  },
);
