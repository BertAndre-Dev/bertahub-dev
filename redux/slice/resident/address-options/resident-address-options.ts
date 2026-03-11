import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface AddressOptionItem {
  label: string;
  value: string;
}

/** Fetch address fields for an estate (for resident invite-tenant flow). */
export const getResidentEstateFields = createAsyncThunk(
  "resident-address-options/getEstateFields",
  async (
    estateId: string | { id?: string; _id?: string },
    { rejectWithValue },
  ) => {
    try {
      const normalizedEstateId =
        typeof estateId === "string"
          ? estateId
          : estateId?._id || estateId?.id || "";

      const res = await axiosInstance.get(
        `/api/v1/address-mgt/estate/${normalizedEstateId}/fields`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return rejectWithValue({
        message:
          err?.response?.data?.message ??
          "Failed to fetch address fields.",
      });
    }
  },
);

/** Fetch address entries for a field (for resident invite-tenant flow). May return 403 for residents. */
export const getResidentFieldEntries = createAsyncThunk(
  "resident-address-options/getFieldEntries",
  async (
    { fieldId, page = 1, limit = 200 }: { fieldId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/address-mgt/field-entries`,
        { params: { fieldId, page, limit } }
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch address entries.",
      });
    }
  }
);

/** Owner address item from API. */
export interface OwnerAddressItem {
  id: string;
  data?: Record<string, string>;
}

/** Fetch addresses assigned to OWNER residents in an estate. */
export const getOwnerAddressesByEstate = createAsyncThunk(
  "resident-address-options/getOwnerAddressesByEstate",
  async (
    { estateId, page = 1, limit = 200 }: { estateId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/address-mgt/owner/${estateId}`,
        { params: { page, limit } }
      );
      const data =
        res.data?.data ??
        (res.data as { data?: OwnerAddressItem[] })?.data ??
        [];
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch owner addresses.",
      });
    }
  }
);
