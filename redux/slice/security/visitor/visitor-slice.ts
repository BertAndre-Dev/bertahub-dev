import { createSlice } from "@reduxjs/toolkit";
import { getAllVisitors } from "./visitor";

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
  allVisitors: SecurityAllVisitorsResponse | null;
  error: string | null;
}

const initialState: SecurityVisitorState = {
  getAllVisitorsStatus: "idle",
  allVisitors: null,
  error: null,
};

const securityVisitorSlice = createSlice({
  name: "securityVisitor",
  initialState,
  reducers: {
    resetSecurityVisitorState: (state) => {
      state.getAllVisitorsStatus = "idle";
      state.allVisitors = null;
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
      });
  },
});

export const { resetSecurityVisitorState } = securityVisitorSlice.actions;
export default securityVisitorSlice.reducer;
