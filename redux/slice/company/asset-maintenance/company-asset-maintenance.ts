import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type ApiPagination = {
  total?: number;
  page?: number;
  limit?: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
};

export type MaintenanceFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type AssetMaintenanceRecord = {
  id?: string;
  _id?: string;
  estateId?: string;
  assetId?: string | { id?: string; _id?: string; name?: string };
  categoryId?: string | { id?: string; _id?: string; name?: string };
  tag?: string;
  lastMaintenanceDate?: string;
  frequency?: string;
  note?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MaintenanceListResponse = {
  success?: boolean;
  message?: string;
  data?: AssetMaintenanceRecord[];
  pagination?: ApiPagination;
};

export type GetMaintenanceListParams = {
  estateId: string;
  page?: number;
  limit?: number;
  isActive?: string;
};

export type CreateMaintenancePayload = {
  estateId: string;
  assetId: string;
  categoryId: string;
  tag: string;
  lastMaintenanceDate: string;
  frequency: string;
  note?: string;
};

export type UpdateMaintenancePayload = {
  maintenanceId: string;
  lastMaintenanceDate?: string;
  frequency?: string;
  note?: string;
};

const normalizeId = (id: string | undefined) => id ?? "";

/** POST /api/v1/asset-maintenance */
export const createAssetMaintenance = createAsyncThunk(
  "company-asset-maintenance/create",
  async (payload: CreateMaintenancePayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/asset-maintenance", payload);
      return res.data as { success?: boolean; message?: string; data?: AssetMaintenanceRecord };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      return rejectWithValue({
        message: Array.isArray(msg) ? msg[0] : msg ?? "Failed to create maintenance record",
      });
    }
  },
);

/** GET /api/v1/asset-maintenance?estateId=... */
export const getAssetMaintenanceList = createAsyncThunk(
  "company-asset-maintenance/getList",
  async (params: GetMaintenanceListParams, { rejectWithValue }) => {
    try {
      const { estateId, page = 1, limit = 10, isActive } = params;
      const estateIdValue = normalizeId(estateId).trim();
      if (!estateIdValue) {
        return rejectWithValue({ message: "Estate is required." });
      }
      const res = await axiosInstance.get<MaintenanceListResponse>(
        "/api/v1/asset-maintenance",
        {
          params: {
            estateId: estateIdValue,
            page,
            limit,
            isActive: isActive?.trim() || undefined,
          },
        },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch maintenance records",
      });
    }
  },
);

/** GET /api/v1/asset-maintenance/{maintenanceId} */
export const getAssetMaintenanceById = createAsyncThunk(
  "company-asset-maintenance/getById",
  async (maintenanceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}`,
      );
      return res.data as { success?: boolean; message?: string; data?: AssetMaintenanceRecord };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch maintenance record",
      });
    }
  },
);

/** PUT /api/v1/asset-maintenance/{maintenanceId} */
export const updateAssetMaintenance = createAsyncThunk(
  "company-asset-maintenance/update",
  async (payload: UpdateMaintenancePayload, { rejectWithValue }) => {
    try {
      const { maintenanceId, ...body } = payload;
      const res = await axiosInstance.put(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}`,
        body,
      );
      return { ...(res.data as object), maintenanceId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update maintenance record",
      });
    }
  },
);

/** DELETE /api/v1/asset-maintenance/{maintenanceId} */
export const deleteAssetMaintenance = createAsyncThunk(
  "company-asset-maintenance/delete",
  async (maintenanceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}`,
      );
      return { ...(res.data as object), deletedId: maintenanceId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete maintenance record",
      });
    }
  },
);

/** PUT /api/v1/asset-maintenance/{maintenanceId}/suspend */
export const suspendAssetMaintenance = createAsyncThunk(
  "company-asset-maintenance/suspend",
  async (maintenanceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}/suspend`,
      );
      return { ...(res.data as object), maintenanceId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to suspend maintenance record",
      });
    }
  },
);

/** PUT /api/v1/asset-maintenance/{maintenanceId}/activate */
export const activateAssetMaintenance = createAsyncThunk(
  "company-asset-maintenance/activate",
  async (maintenanceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}/activate`,
      );
      return { ...(res.data as object), maintenanceId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to activate maintenance record",
      });
    }
  },
);
