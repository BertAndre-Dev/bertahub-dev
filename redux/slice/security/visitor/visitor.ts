import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type VisitingType = "SHORT_VISIT" | "LONG_VISIT";

export type ScanVisitorParams = {
  barcode: string;
  visitingType?: VisitingType;
  visitEndDate?: string;
};

function extractErrorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data;
  if (!data) return fallback;
  const { message } = data;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  return fallback;
}

export const getAllVisitors = createAsyncThunk(
  "securityVisitor/getAllVisitors",
  async (
    { estateId, page = 1, limit = 10 }: { estateId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/visitor-mgt/all-visitors/${estateId}?page=${page}&limit=${limit}`
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

/** POST /api/v1/visitor-mgt/scan — verify visitor from scanned QR / barcode */
export const scanVisitor = createAsyncThunk(
  "securityVisitor/scanVisitor",
  async (params: ScanVisitorParams, { rejectWithValue }) => {
    const barcode = params.barcode.trim();
    if (!barcode) {
      return rejectWithValue({ message: "Barcode is required" });
    }

    try {
      const body: Record<string, string> = { barcode };
      if (params.visitingType) body.visitingType = params.visitingType;
      if (params.visitEndDate) body.visitEndDate = params.visitEndDate;

      const res = await axiosInstance.post("/api/v1/visitor-mgt/scan", body);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({
        message: extractErrorMessage(error, "Failed to verify visitor"),
      });
    }
  },
);

export const checkoutVisitor = createAsyncThunk(
  "securityVisitor/checkoutVisitor",
  async (
    { visitorCode }: { visitorCode: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.post("/api/v1/visitor-mgt/checkout", {
        visitorCode,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);
