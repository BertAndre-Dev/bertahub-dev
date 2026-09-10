import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import {
  apiErrorRejectValue,
  type ApiErrorRejectValue,
} from "@/lib/api-error";
import { extractEstateId } from "@/lib/user-id";
import type {
  BillsSummaryResponse,
  ComplaintsDashboardResponse,
  ComplaintsSummaryResponse,
  MeterSummaryResponse,
} from "@/types/analytics";
import type {
  RoleBreakdownResponse,
  UserSummaryResponse,
} from "@/redux/slice/admin/user-analytics/user-analytics";

function requireEstateId(estateId: string) {
  const id = extractEstateId(estateId);
  if (!id) {
    return null;
  }
  return id;
}

/** GET /api/v1/user-analytics/summary?estateId= */
export const getCompanyUserSummary = createAsyncThunk<
  UserSummaryResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>(
  "company-overview-analytics/getUserSummary",
  async ({ estateId }, { rejectWithValue }) => {
    const id = requireEstateId(estateId);
    if (!id) return rejectWithValue({ message: "Invalid estate ID." });
    try {
      const res = await axiosInstance.get<UserSummaryResponse>(
        "/api/v1/user-analytics/summary",
        { params: { estateId: id } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /api/v1/user-analytics/role-breakdown?estateId= */
export const getCompanyUserRoleBreakdown = createAsyncThunk<
  RoleBreakdownResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>(
  "company-overview-analytics/getUserRoleBreakdown",
  async ({ estateId }, { rejectWithValue }) => {
    const id = requireEstateId(estateId);
    if (!id) return rejectWithValue({ message: "Invalid estate ID." });
    try {
      const res = await axiosInstance.get<RoleBreakdownResponse>(
        "/api/v1/user-analytics/role-breakdown",
        { params: { estateId: id } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /analytics/meters/summary?estateId= */
export const getCompanyMeterSummary = createAsyncThunk<
  MeterSummaryResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>(
  "company-overview-analytics/getMeterSummary",
  async ({ estateId }, { rejectWithValue }) => {
    const id = requireEstateId(estateId);
    if (!id) return rejectWithValue({ message: "Invalid estate ID." });
    try {
      const res = await axiosInstance.get<MeterSummaryResponse>(
        "/analytics/meters/summary",
        { params: { estateId: id } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /analytics/bills/summary?estateId= */
export const getCompanyBillsSummary = createAsyncThunk<
  BillsSummaryResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>(
  "company-overview-analytics/getBillsSummary",
  async ({ estateId }, { rejectWithValue }) => {
    const id = requireEstateId(estateId);
    if (!id) return rejectWithValue({ message: "Invalid estate ID." });
    try {
      const res = await axiosInstance.get<BillsSummaryResponse>(
        "/analytics/bills/summary",
        { params: { estateId: id } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /analytics/complaints/summary?estateId= */
export const getCompanyComplaintsSummary = createAsyncThunk<
  ComplaintsSummaryResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>(
  "company-overview-analytics/getComplaintsSummary",
  async ({ estateId }, { rejectWithValue }) => {
    const id = requireEstateId(estateId);
    if (!id) return rejectWithValue({ message: "Invalid estate ID." });
    try {
      const res = await axiosInstance.get<ComplaintsSummaryResponse>(
        "/analytics/complaints/summary",
        { params: { estateId: id } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /analytics/complaints/dashboard?estateId= */
export const getCompanyComplaintsDashboard = createAsyncThunk<
  ComplaintsDashboardResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>(
  "company-overview-analytics/getComplaintsDashboard",
  async ({ estateId }, { rejectWithValue }) => {
    const id = requireEstateId(estateId);
    if (!id) return rejectWithValue({ message: "Invalid estate ID." });
    try {
      const res = await axiosInstance.get<ComplaintsDashboardResponse>(
        "/analytics/complaints/dashboard",
        { params: { estateId: id } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
