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
  estateId: string;
  page?: number;
  limit?: number;
  search?: string;
}

/** GET /api/v1/user-mgt/invited-tenants/:estateId (OWNER only) */
export const getInvitedTenants = createAsyncThunk(
  "resident-invited-tenants/getInvitedTenants",
  async (
    { estateId, page = 1, limit = 10, search }: GetInvitedTenantsParams,
    { rejectWithValue }
  ) => {
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search?.trim()) params.search = search.trim();
      const res = await axiosInstance.get(
        `/api/v1/user-mgt/invited-tenants/${estateId}`,
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
