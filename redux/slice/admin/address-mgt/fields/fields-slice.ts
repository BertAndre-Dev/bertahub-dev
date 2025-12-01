import { createSlice } from "@reduxjs/toolkit";
import {
  createField,
  deleteField,
  getField,
  getFieldByEstate,
  updateField,
} from "./fields";

interface FieldData {
  estateId: string;
  label: string;
  key: string;
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

export interface AllFieldResponse {
  success: boolean;
  message: string;
  data: FieldData[];
  pagination: Pagination;
}

export interface FieldState {
  createFieldState: "idle" | "isLoading" | "succeeded" | "failed";
  deleteFieldState: "idle" | "isLoading" | "succeeded" | "failed";
  getFieldState: "idle" | "isLoading" | "succeeded" | "failed";
  getFieldByEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  updateFieldState: "idle" | "isLoading" | "succeeded" | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  field: FieldData | null;
  allField: AllFieldResponse | null;
  error: string | null;
}

const initialState: FieldState = {
  createFieldState: "idle",
  deleteFieldState: "idle",
  getFieldState: "idle",
  getFieldByEstateState: "idle",
  updateFieldState: "idle",
  status: "idle",
  field: null,
  allField: null,
  error: null,
};

const fieldSlice = createSlice({
  name: "field",
  initialState,
  reducers: {
    resetFieldState: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers(builder) {
    // ✅ GET FIELDS BY ESTATE
    builder
      .addCase(getFieldByEstate.pending, (state) => {
        state.getFieldByEstateState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(getFieldByEstate.fulfilled, (state, action) => {
        state.getFieldByEstateState = "succeeded";
        state.status = "succeeded";
        state.allField = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ??
            "Address fields retrieved successfully.",
          data: action.payload?.data || [],
          pagination: action.payload?.pagination || {
            total: action.payload?.data?.length ?? 0,
            currentPage: 1,
            totalPages: 1,
            pageSize: 10,
          },
        };
      })
      .addCase(getFieldByEstate.rejected, (state, action) => {
        state.getFieldByEstateState = "failed";
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch estate fields";
      });

    // ✅ GET SINGLE FIELD
    builder
      .addCase(getField.pending, (state) => {
        state.getFieldState = "isLoading";
      })
      .addCase(getField.fulfilled, (state, action) => {
        state.getFieldState = "succeeded";
        state.field = action.payload?.data || null;
      })
      .addCase(getField.rejected, (state, action) => {
        state.getFieldState = "failed";
        state.error = action.error.message || "Failed to fetch field";
      });

    // ✅ CREATE FIELD
    builder
      .addCase(createField.pending, (state) => {
        state.createFieldState = "isLoading";
      })
      .addCase(createField.fulfilled, (state, action) => {
        state.createFieldState = "succeeded";
        const newField = action.payload?.data;
        if (newField) {
          if (state.allField?.data) {
            state.allField.data.push(newField);
            state.allField.pagination.total += 1;
          } else {
            state.allField = {
              success: true,
              message: "Field created successfully",
              data: [newField],
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
      .addCase(createField.rejected, (state, action) => {
        state.createFieldState = "failed";
        state.error =
          action.error.message || "Failed to create estate address field";
      });

    // ✅ UPDATE FIELD
    builder
      .addCase(updateField.pending, (state) => {
        state.updateFieldState = "isLoading";
      })
      .addCase(updateField.fulfilled, (state, action) => {
        state.updateFieldState = "succeeded";
        const updated = action.payload?.data;
        if (updated && state.allField?.data) {
          state.allField.data = state.allField.data.map((field) =>
            field.id === updated.id ? updated : field
          );
        }
      })
      .addCase(updateField.rejected, (state, action) => {
        state.updateFieldState = "failed";
        state.error =
          action.error.message || "Failed to update estate address field";
      });

    // ✅ DELETE FIELD
    builder
      .addCase(deleteField.pending, (state) => {
        state.deleteFieldState = "isLoading";
      })
      .addCase(deleteField.fulfilled, (state, action) => {
        state.deleteFieldState = "succeeded";
        const deletedId = action.meta.arg;
        if (state.allField?.data) {
          state.allField.data = state.allField.data.filter(
            (field) => field.id !== deletedId
          );
          state.allField.pagination.total -= 1;
        }
      })
      .addCase(deleteField.rejected, (state, action) => {
        state.deleteFieldState = "failed";
        state.error = action.error.message || "Failed to delete estate field";
      });
  },
});

export const { resetFieldState } = fieldSlice.actions;
export default fieldSlice.reducer;
