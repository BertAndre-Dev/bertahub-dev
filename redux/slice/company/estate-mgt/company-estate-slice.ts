import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import {
  activateCompanyEstate,
  createCompanyEstate,
  deleteCompanyEstate,
  fetchCompanyEstateModules,
  getCompanyEstateById,
  getCompanyEstates,
  suspendCompanyEstate,
  updateCompanyEstate,
} from "./company-estate";

export interface EstateDetails {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
  modules?: string[];
  createdAt?: string;
  updatedAt?: string;
  id?: string;
  _id?: string;
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

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyEstateState {
  activateEstateStatus: AsyncStatus;
  createEstateStatus: AsyncStatus;
  deleteEstateStatus: AsyncStatus;
  getAllEstatesStatus: AsyncStatus;
  getEstateStatus: AsyncStatus;
  suspendEstateStatus: AsyncStatus;
  updateEstateStatus: AsyncStatus;
  estate: EstateDetails | null;
  allEstates: AllEstatesResponse | null;
  error: string | null;
  availableModules: string[];
  modulesLoading: boolean;
  modulesError: string | null;
}

const initialState: CompanyEstateState = {
  activateEstateStatus: "idle",
  createEstateStatus: "idle",
  deleteEstateStatus: "idle",
  getAllEstatesStatus: "idle",
  getEstateStatus: "idle",
  suspendEstateStatus: "idle",
  updateEstateStatus: "idle",
  estate: null,
  allEstates: null,
  error: null,
  availableModules: [],
  modulesLoading: false,
  modulesError: null,
};

function estateId(est: EstateDetails) {
  return est.id || est._id || "";
}

const companyEstateSlice = createSlice({
  name: "companyEstate",
  initialState,
  reducers: {
    clearCompanyEstateError: (state) => {
      state.error = null;
    },
    resetCompanyEstateState: (state) => {
      state.getAllEstatesStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyEstateModules.pending, (state) => {
        state.modulesLoading = true;
        state.modulesError = null;
      })
      .addCase(fetchCompanyEstateModules.fulfilled, (state, action) => {
        state.modulesLoading = false;
        state.modulesError = null;
        state.availableModules = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];
      })
      .addCase(fetchCompanyEstateModules.rejected, (state, action) => {
        state.modulesLoading = false;
        state.modulesError =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to load modules";
        state.availableModules = [];
      })
      .addCase(getCompanyEstates.pending, (state) => {
        state.getAllEstatesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyEstates.fulfilled, (state, action) => {
        state.getAllEstatesStatus = "succeeded";
        const pagination = action.payload?.pagination;
        state.allEstates = {
          success: action.payload?.success ?? true,
          message: action.payload?.message ?? "Estates retrieved successfully",
          data: action.payload?.data ?? [],
          pagination: {
            total: pagination?.total ?? action.payload?.data?.length ?? 0,
            currentPage: Number(pagination?.currentPage) || 1,
            totalPages: Number(pagination?.totalPages) || 1,
            pageSize: Number(pagination?.pageSize) || 10,
          },
        };
      })
      .addCase(getCompanyEstates.rejected, (state, action) => {
        state.getAllEstatesStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch estates";
      })
      .addCase(getCompanyEstateById.pending, (state) => {
        state.getEstateStatus = "isLoading";
      })
      .addCase(getCompanyEstateById.fulfilled, (state, action) => {
        state.getEstateStatus = "succeeded";
        state.estate = action.payload?.data ?? null;
      })
      .addCase(getCompanyEstateById.rejected, (state, action) => {
        state.getEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch estate";
      })
      .addCase(createCompanyEstate.pending, (state) => {
        state.createEstateStatus = "isLoading";
      })
      .addCase(createCompanyEstate.fulfilled, (state, action) => {
        state.createEstateStatus = "succeeded";
        const created = action.payload?.data as EstateDetails | undefined;
        if (created && state.allEstates?.data) {
          state.allEstates.data.push(created);
          state.allEstates.pagination.total += 1;
        }
      })
      .addCase(createCompanyEstate.rejected, (state, action) => {
        state.createEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to create estate";
      })
      .addCase(updateCompanyEstate.pending, (state) => {
        state.updateEstateStatus = "isLoading";
      })
      .addCase(updateCompanyEstate.fulfilled, (state, action) => {
        state.updateEstateStatus = "succeeded";
        const updated = action.payload?.data as EstateDetails | undefined;
        if (updated?.id && state.allEstates?.data) {
          const id = updated.id || updated._id;
          state.allEstates.data = state.allEstates.data.map((est) =>
            estateId(est) === id ? { ...est, ...updated } : est,
          );
        }
      })
      .addCase(updateCompanyEstate.rejected, (state, action) => {
        state.updateEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to update estate";
      })
      .addCase(deleteCompanyEstate.pending, (state) => {
        state.deleteEstateStatus = "isLoading";
      })
      .addCase(deleteCompanyEstate.fulfilled, (state, action) => {
        state.deleteEstateStatus = "succeeded";
        const deletedId = (action.payload as { deletedId?: string })?.deletedId;
        if (deletedId && state.allEstates?.data) {
          state.allEstates.data = state.allEstates.data.filter(
            (est) => estateId(est) !== deletedId,
          );
          state.allEstates.pagination.total = Math.max(
            0,
            state.allEstates.pagination.total - 1,
          );
        }
      })
      .addCase(deleteCompanyEstate.rejected, (state, action) => {
        state.deleteEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to delete estate";
      })
      .addCase(activateCompanyEstate.pending, (state) => {
        state.activateEstateStatus = "isLoading";
      })
      .addCase(activateCompanyEstate.fulfilled, (state, action) => {
        state.activateEstateStatus = "succeeded";
        const updated = action.payload?.data as EstateDetails | undefined;
        if (updated && state.allEstates?.data) {
          const id = estateId(updated);
          state.allEstates.data = state.allEstates.data.map((est) =>
            estateId(est) === id ? { ...est, ...updated, isActive: true } : est,
          );
        }
      })
      .addCase(activateCompanyEstate.rejected, (state, action) => {
        state.activateEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to activate estate";
      })
      .addCase(suspendCompanyEstate.pending, (state) => {
        state.suspendEstateStatus = "isLoading";
      })
      .addCase(suspendCompanyEstate.fulfilled, (state, action) => {
        state.suspendEstateStatus = "succeeded";
        const updated = action.payload?.data as EstateDetails | undefined;
        if (updated && state.allEstates?.data) {
          const id = estateId(updated);
          state.allEstates.data = state.allEstates.data.map((est) =>
            estateId(est) === id ? { ...est, ...updated, isActive: false } : est,
          );
        }
      })
      .addCase(suspendCompanyEstate.rejected, (state, action) => {
        state.suspendEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to suspend estate";
      });
  },
});

export const { clearCompanyEstateError, resetCompanyEstateState } =
  companyEstateSlice.actions;
export default companyEstateSlice.reducer;

export const selectCompanyAvailableModules = (state: RootState) =>
  state.companyEstate?.availableModules ?? [];
export const selectCompanyModulesLoading = (state: RootState) =>
  state.companyEstate?.modulesLoading ?? false;
export const selectCompanyModulesError = (state: RootState) =>
  state.companyEstate?.modulesError ?? null;
