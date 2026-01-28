import { createSlice } from "@reduxjs/toolkit";
import {
  createVisitor,
  getVisitorsByResident,
  getVisitorById,
  updateVisitor,
} from "./visitor";

export interface VisitorEntry {
  id: string;
  data: Record<string, any>;
}

export interface NestedVisitor {
  id: string;
  visitorCode: string;
  residentId: string;
  estateId: string;
  addressId: string;
  visitor: Array<{ id: string }>;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  purpose?: string;
}

export interface VisitorWithEntries {
  visitor: NestedVisitor;
  entries: VisitorEntry[];
}

export interface VisitorsResponse {
  success: boolean;
  message: string;
  data: VisitorWithEntries[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ResidentVisitorState {
  createVisitorState: "idle" | "isLoading" | "succeeded" | "failed";
  getVisitorsByResidentState: "idle" | "isLoading" | "succeeded" | "failed";
  getVisitorByIdState: "idle" | "isLoading" | "succeeded" | "failed";
  updateVisitorState: "idle" | "isLoading" | "succeeded" | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  allVisitors: VisitorsResponse | null;
  singleVisitor: VisitorWithEntries | null;
  error: string | null;
}

const initialState: ResidentVisitorState = {
  createVisitorState: "idle",
  getVisitorsByResidentState: "idle",
  getVisitorByIdState: "idle",
  updateVisitorState: "idle",
  status: "idle",
  allVisitors: null,
  singleVisitor: null,
  error: null,
};

const residentVisitorSlice = createSlice({
  name: "residentVisitor",
  initialState,
  reducers: {
    resetResidentVisitorState: (state) => {
      state.status = "idle";
      state.error = null;
      state.createVisitorState = "idle";
      state.getVisitorsByResidentState = "idle";
      state.getVisitorByIdState = "idle";
      state.updateVisitorState = "idle";
    },
  },
  extraReducers(builder) {
    // ✅ CREATE VISITOR
    builder
      .addCase(createVisitor.pending, (state) => {
        state.createVisitorState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(createVisitor.fulfilled, (state, action) => {
        state.createVisitorState = "succeeded";
        state.status = "succeeded";
        const newVisitor = action.payload?.data;
        if (newVisitor && state.allVisitors?.data) {
          state.allVisitors.data.push(newVisitor);
          state.allVisitors.pagination.total += 1;
        }
      })
      .addCase(createVisitor.rejected, (state, action: any) => {
        state.createVisitorState = "failed";
        state.status = "failed";
        state.error = action.payload?.message || action.error.message || "Failed to create visitor";
      });

    // ✅ GET VISITORS BY RESIDENT
    builder
      .addCase(getVisitorsByResident.pending, (state) => {
        state.getVisitorsByResidentState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(getVisitorsByResident.fulfilled, (state, action) => {
        state.getVisitorsByResidentState = "succeeded";
        state.status = "succeeded";
        state.allVisitors = action.payload || null;
      })
      .addCase(getVisitorsByResident.rejected, (state, action: any) => {
        state.getVisitorsByResidentState = "failed";
        state.status = "failed";
        state.error = action.payload?.message || action.error.message || "Failed to fetch visitors";
      });

    // ✅ GET SINGLE VISITOR BY ID
    builder
      .addCase(getVisitorById.pending, (state) => {
        state.getVisitorByIdState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(getVisitorById.fulfilled, (state, action) => {
        state.getVisitorByIdState = "succeeded";
        state.status = "succeeded";
        state.singleVisitor = action.payload?.data || null;
      })
      .addCase(getVisitorById.rejected, (state, action: any) => {
        state.getVisitorByIdState = "failed";
        state.status = "failed";
        state.error = action.payload?.message || action.error.message || "Failed to fetch visitor";
      });

    // ✅ UPDATE VISITOR
    builder
      .addCase(updateVisitor.pending, (state) => {
        state.updateVisitorState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(updateVisitor.fulfilled, (state, action) => {
        state.updateVisitorState = "succeeded";
        state.status = "succeeded";
        const updatedVisitor = action.payload?.data;
        
        // Update in allVisitors list if it exists
        if (updatedVisitor && state.allVisitors?.data) {
          state.allVisitors.data = state.allVisitors.data.map((v) =>
            v.visitor.id === updatedVisitor.id
              ? { ...v, visitor: { ...v.visitor, ...updatedVisitor } }
              : v
          );
        }
        
        // Update singleVisitor if it's the one being updated
        if (updatedVisitor && state.singleVisitor?.visitor.id === updatedVisitor.id) {
          state.singleVisitor = {
            ...state.singleVisitor,
            visitor: { ...state.singleVisitor.visitor, ...updatedVisitor },
          };
        }
      })
      .addCase(updateVisitor.rejected, (state, action: any) => {
        state.updateVisitorState = "failed";
        state.status = "failed";
        state.error = action.payload?.message || action.error.message || "Failed to update visitor";
      });
  },
});

export const { resetResidentVisitorState } = residentVisitorSlice.actions;
export default residentVisitorSlice.reducer;
