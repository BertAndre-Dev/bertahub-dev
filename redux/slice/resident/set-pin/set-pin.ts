import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface CreateBillPinPayload {
  pin: string;
}

export interface UpdateBillPinPayload {
  currentPin: string;
  newPin: string;
}

export interface BillPinError {
  message: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function extractErrorMessage(error: any, fallback: string): BillPinError {
  return {
    message:
      error?.response?.data?.message ??
      error?.message ??
      fallback,
  };
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const createBillPaymentPin = createAsyncThunk<
  unknown,
  CreateBillPinPayload,
  { rejectValue: BillPinError }
>(
  "residentBillPin/create",
  async ({ pin }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        "/api/v1/user-mgt/bill-pin/create",
        { pin },
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Failed to create bill payment PIN."),
      );
    }
  },
);

export const updateBillPaymentPin = createAsyncThunk<
  unknown,
  UpdateBillPinPayload,
  { rejectValue: BillPinError }
>(
  "residentBillPin/update",
  async ({ currentPin, newPin }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(
        "/api/v1/user-mgt/bill-pin/update",
        { currentPin, newPin },
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, "Failed to update bill payment PIN."),
      );
    }
  },
);