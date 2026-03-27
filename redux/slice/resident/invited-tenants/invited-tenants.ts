import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface InvitedTenantAddress {
  /** Address entry id from address-mgt (API uses `id`) */
  id: string;
  data?: Record<string, string>;
}

export interface InvitedTenantItem {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  invitationStatus?: string;
  isVerified?: boolean;
  isActive?: boolean;
  addressIds?: InvitedTenantAddress[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GetInvitedTenantsParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/** GET /api/v1/user-mgt/invited-tenants (OWNER only) */
export const getInvitedTenants = createAsyncThunk(
  "resident-invited-tenants/getInvitedTenants",
  async (
    { page = 1, limit = 10, search, startDate, endDate }: GetInvitedTenantsParams,
    { rejectWithValue }
  ) => {
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search?.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await axiosInstance.get(
        `/api/v1/user-mgt/invited-tenants`,
        { params }
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch invited tenants",
      });
    }
  }
);
