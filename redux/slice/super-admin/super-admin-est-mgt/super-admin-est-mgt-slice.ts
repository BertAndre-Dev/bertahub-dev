import { createSlice } from "@reduxjs/toolkit";
import {
  activateEstate,
  createEstate,
  deleteEstate,
  getAllEstates,
  getEstate,
  suspendEstate,
  updateEstate,
} from "./super-admin-est-mgt";

// 🏠 Estate Types
export interface EstateDetails {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
}

export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface AllEstatesResponse {
  success: boolean;
  message: string;
  data: EstateDetails[];
  pagination: Pagination;
}

export interface EstateState {
  activateEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  createEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  deleteEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  getAllEstatesState: "idle" | "isLoading" | "succeeded" | "failed";
  getEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  suspendEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  updateEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  estate: EstateDetails | null;
  allEstates: AllEstatesResponse | null;
  error: string | null;
}

// 🧱 Initial State
const initialState: EstateState = {
  activateEstateState: "idle",
  createEstateState: "idle",
  deleteEstateState: "idle",
  getAllEstatesState: "idle",
  getEstateState: "idle",
  suspendEstateState: "idle",
  updateEstateState: "idle",
  status: "idle",
  estate: null,
  allEstates: null,
  error: null,
};

// 🧩 Slice Definition
const estateSlice = createSlice({
  name: "estate",
  initialState,
  reducers: {
    resetEstateState: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 🔹 GET ALL ESTATES
    builder
      .addCase(getAllEstates.pending, (state) => {
        state.getAllEstatesState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(getAllEstates.fulfilled, (state, action) => {
        state.getAllEstatesState = "succeeded";
        state.status = "succeeded";
        // ✅ Now store both data and pagination
        state.allEstates = {
          success: action.payload?.success ?? true,
          message: action.payload?.message ?? "Estates retrieved successfully",
          data: action.payload?.data || [],
          pagination: action.payload?.pagination || {
            total: 0,
            currentPage: 1,
            totalPages: 1,
            pageSize: 10,
          },
        };
      })
      .addCase(getAllEstates.rejected, (state, action) => {
        state.getAllEstatesState = "failed";
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch estates";
      });

    // 🔹 GET SINGLE ESTATE
    builder
      .addCase(getEstate.pending, (state) => {
        state.getEstateState = "isLoading";
      })
      .addCase(getEstate.fulfilled, (state, action) => {
        state.getEstateState = "succeeded";
        state.estate = action.payload?.data || null;
      })
      .addCase(getEstate.rejected, (state, action) => {
        state.getEstateState = "failed";
        state.error = action.error.message || "Failed to fetch estate";
      });

    // 🔹 CREATE ESTATE
    builder
      .addCase(createEstate.pending, (state) => {
        state.createEstateState = "isLoading";
      })
      .addCase(createEstate.fulfilled, (state, action) => {
        state.createEstateState = "succeeded";
        if (action.payload?.data) {
          // Append new estate if the list already exists
          if (state.allEstates?.data) {
            state.allEstates.data.push(action.payload.data);
            state.allEstates.pagination.total += 1;
          } else {
            state.allEstates = {
              success: true,
              message: "Estate created successfully",
              data: [action.payload.data],
              pagination: {
                total: 1,
                currentPage: 1,
                totalPages: 1,
                pageSize: 10,
              },
            };
          }
        }
      })
      .addCase(createEstate.rejected, (state, action) => {
        state.createEstateState = "failed";
        state.error = action.error.message || "Failed to create estate";
      });

    // 🔹 UPDATE ESTATE
    builder
      .addCase(updateEstate.pending, (state) => {
        state.updateEstateState = "isLoading";
      })
      .addCase(updateEstate.fulfilled, (state, action) => {
        state.updateEstateState = "succeeded";
        const updated = action.payload?.data;
        if (updated && state.allEstates?.data) {
          state.allEstates.data = state.allEstates.data.map((est) =>
            est.id === updated.id ? updated : est
          );
        }
      })
      .addCase(updateEstate.rejected, (state, action) => {
        state.updateEstateState = "failed";
        state.error = action.error.message || "Failed to update estate";
      });

    // 🔹 DELETE ESTATE
    builder
      .addCase(deleteEstate.pending, (state) => {
        state.deleteEstateState = "isLoading";
      })
      .addCase(deleteEstate.fulfilled, (state, action) => {
        state.deleteEstateState = "succeeded";
        const deletedId = action.meta.arg; // Assuming you pass id as arg
        if (state.allEstates?.data) {
          state.allEstates.data = state.allEstates.data.filter(
            (est) => est.id !== deletedId
          );
          state.allEstates.pagination.total -= 1;
        }
      })
      .addCase(deleteEstate.rejected, (state, action) => {
        state.deleteEstateState = "failed";
        state.error = action.error.message || "Failed to delete estate";
      });

    // 🔹 ACTIVATE ESTATE
    builder
      .addCase(activateEstate.pending, (state) => {
        state.activateEstateState = "isLoading";
      })
      .addCase(activateEstate.fulfilled, (state, action) => {
        state.activateEstateState = "succeeded";
        const updated = action.payload?.data;
        if (updated && state.allEstates?.data) {
          state.allEstates.data = state.allEstates.data.map((est) =>
            est.id === updated.id ? updated : est
          );
        }
      })
      .addCase(activateEstate.rejected, (state, action) => {
        state.activateEstateState = "failed";
        state.error = action.error.message || "Failed to activate estate";
      });

    // 🔹 SUSPEND ESTATE
    builder
      .addCase(suspendEstate.pending, (state) => {
        state.suspendEstateState = "isLoading";
      })
      .addCase(suspendEstate.fulfilled, (state, action) => {
        state.suspendEstateState = "succeeded";
        const updated = action.payload?.data;
        if (updated && state.allEstates?.data) {
          state.allEstates.data = state.allEstates.data.map((est) =>
            est.id === updated.id ? updated : est
          );
        }
      })
      .addCase(suspendEstate.rejected, (state, action) => {
        state.suspendEstateState = "failed";
        state.error = action.error.message || "Failed to suspend estate";
      });
  },
});

// Export actions & reducer
export const { resetEstateState } = estateSlice.actions;
export default estateSlice.reducer;
