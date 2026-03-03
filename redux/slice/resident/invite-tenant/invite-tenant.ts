import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

/**
 * Payload for resident (owner) inviting a tenant.
 * POST /api/v1/auth-mgt/invite-user
 * Resident type owner can only invite residentType: "tenant".
 */
export interface InviteTenantPayload {
  estateId: string;
  firstName: string;
  lastName: string;
  email: string;
  addressIds: string[];
}

export interface InviteTenantResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

export const inviteTenant = createAsyncThunk(
  "resident-invite-tenant/inviteTenant",
  async (payload: InviteTenantPayload, { rejectWithValue }) => {
    try {
      const body = {
        ...payload,
        role: "resident",
        residentType: "tenant",
      };
      const res = await axiosInstance.post<InviteTenantResponse>(
        "/api/v1/auth-mgt/invite-user",
        body
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to invite tenant.",
      });
    }
  }
);
