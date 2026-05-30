import { createSlice } from "@reduxjs/toolkit";
import { getAllVisitors, scanVisitor } from "./visitor";

export interface SecurityVisitorItem {
  id: string;
  visitorCode: string;
  residentId: { id: string; firstName: string; lastName: string } | null;
  estateId: string;
  addressId: { id: string; data: Record<string, string> };
  firstName: string;
  lastName: string;
  phone: string;
  purpose: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  viewedBy?: { id: string; firstName: string; lastName: string };
  verifiedBy?: { id: string; firstName: string; lastName: string };
  /** When the visitor was checked in (if API returns it). */
  checkedInAt?: string;
  /** When the visitor was checked out (if API returns it). */
  checkedOutAt?: string;
}

export interface SecurityAllVisitorsResponse {
  success: boolean;
  message: string;
  data: SecurityVisitorItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SecurityVisitorState {
  getAllVisitorsStatus: "idle" | "isLoading" | "succeeded" | "failed";
  scanVisitorStatus: "idle" | "isLoading" | "succeeded" | "failed";
  allVisitors: SecurityAllVisitorsResponse | null;
  lastScannedVisitor: SecurityVisitorItem | null;
  error: string | null;
}

const initialState: SecurityVisitorState = {
  getAllVisitorsStatus: "idle",
  scanVisitorStatus: "idle",
  allVisitors: null,
  lastScannedVisitor: null,
  error: null,
};

const securityVisitorSlice = createSlice({
  name: "securityVisitor",
  initialState,
  reducers: {
    resetSecurityVisitorState: (state) => {
      state.getAllVisitorsStatus = "idle";
      state.scanVisitorStatus = "idle";
      state.allVisitors = null;
      state.lastScannedVisitor = null;
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getAllVisitors.pending, (state) => {
        state.getAllVisitorsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAllVisitors.fulfilled, (state, action) => {
        state.getAllVisitorsStatus = "succeeded";
        state.allVisitors = action.payload ?? null;
      })
      .addCase(getAllVisitors.rejected, (state, action) => {
        state.getAllVisitorsStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch visitors";
      })

      .addCase(scanVisitor.pending, (state) => {
        state.scanVisitorStatus = "isLoading";
        state.error = null;
      })
      .addCase(scanVisitor.fulfilled, (state, action) => {
        state.scanVisitorStatus = "succeeded";
        const data = (action.payload as { data?: SecurityVisitorItem })?.data;
        if (data) state.lastScannedVisitor = data;
      })
      .addCase(scanVisitor.rejected, (state, action) => {
        state.scanVisitorStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to verify visitor";
      });
  },
});

export const { resetSecurityVisitorState } = securityVisitorSlice.actions;
export default securityVisitorSlice.reducer;
