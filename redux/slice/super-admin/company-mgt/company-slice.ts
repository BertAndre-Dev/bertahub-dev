import { createSlice } from "@reduxjs/toolkit";
import {
  activateCompany,
  createCompany,
  deleteCompany,
  getCompanies,
  getCompanyById,
  getCompanyModules,
  suspendCompany,
  updateCompany,
  updateCompanyModules,
  type CompanyItem,
  type CompanyModuleKey,
} from "./company";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface SuperAdminCompanyState {
  list: CompanyItem[] | null;
  pagination:
    | { total: number; currentPage: number; totalPages: number; pageSize: number }
    | null;
  current: CompanyItem | null;
  modules: CompanyModuleKey[];

  getListStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  getModulesStatus: AsyncStatus;
  createStatus: AsyncStatus;
  updateStatus: AsyncStatus;
  deleteStatus: AsyncStatus;

  error: string | null;
}

const initialState: SuperAdminCompanyState = {
  list: null,
  pagination: null,
  current: null,
  modules: [],
  getListStatus: "idle",
  getByIdStatus: "idle",
  getModulesStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

const companySlice = createSlice({
  name: "superAdminCompany",
  initialState,
  reducers: {
    clearCurrentCompany: (state) => {
      state.current = null;
      state.getByIdStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCompanies.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanies.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        state.list = action.payload?.data ?? [];
        state.pagination = action.payload?.pagination
          ? {
              total: action.payload.pagination.total ?? 0,
              currentPage: action.payload.pagination.currentPage ?? 1,
              totalPages: action.payload.pagination.totalPages ?? 1,
              pageSize: action.payload.pagination.pageSize ?? 10,
            }
          : null;
      })
      .addCase(getCompanies.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = null;
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch companies";
      })
      .addCase(getCompanyById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.current = action.payload?.data ?? null;
      })
      .addCase(getCompanyById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.current = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch company";
      })
      .addCase(getCompanyModules.pending, (state) => {
        state.getModulesStatus = "isLoading";
      })
      .addCase(getCompanyModules.fulfilled, (state, action) => {
        state.getModulesStatus = "succeeded";
        state.modules = action.payload?.data ?? [];
      })
      .addCase(getCompanyModules.rejected, (state, action) => {
        state.getModulesStatus = "failed";
        state.modules = [];
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch company modules";
      })
      .addCase(createCompany.pending, (state) => {
        state.createStatus = "isLoading";
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const created = action.payload?.data;
        if (created) {
          state.list = [created, ...(state.list ?? [])];
          if (state.pagination) state.pagination.total += 1;
        }
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to create company";
      })
      .addCase(updateCompany.pending, (state) => {
        state.updateStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const updated = action.payload?.data;
        const updatedId = (action.payload as any)?.updatedId as string | undefined;
        const id = updated?.id ?? updated?._id ?? updatedId;
        if (id && state.list) {
          const i = state.list.findIndex((x) => (x.id ?? x._id) === id);
          if (i !== -1 && updated) state.list[i] = { ...state.list[i], ...updated };
        }
        if (state.current && id && (state.current.id ?? state.current._id) === id) {
          if (updated) state.current = { ...state.current, ...updated };
        }
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to update company";
      })
      .addCase(updateCompanyModules.fulfilled, (state, action) => {
        const updatedId = (action.payload as any)?.updatedId as string | undefined;
        const modules = (action.payload as any)?.modules as CompanyModuleKey[] | undefined;
        if (!updatedId || !modules) return;
        if (state.list) {
          const i = state.list.findIndex((x) => (x.id ?? x._id) === updatedId);
          if (i !== -1) state.list[i] = { ...state.list[i], modules };
        }
        if (state.current && (state.current.id ?? state.current._id) === updatedId) {
          state.current = { ...state.current, modules };
        }
      })
      .addCase(suspendCompany.fulfilled, (state, action) => {
        const id = (action.payload as any)?.companyId as string | undefined;
        if (!id) return;
        if (state.list) {
          const r = state.list.find((x) => (x.id ?? x._id) === id);
          if (r) r.isActive = false;
        }
        if (state.current && (state.current.id ?? state.current._id) === id) {
          state.current.isActive = false;
        }
      })
      .addCase(activateCompany.fulfilled, (state, action) => {
        const id = (action.payload as any)?.companyId as string | undefined;
        if (!id) return;
        if (state.list) {
          const r = state.list.find((x) => (x.id ?? x._id) === id);
          if (r) r.isActive = true;
        }
        if (state.current && (state.current.id ?? state.current._id) === id) {
          state.current.isActive = true;
        }
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        const id = (action.payload as any)?.deletedId as string | undefined;
        if (!id) return;
        if (state.list) {
          state.list = state.list.filter((x) => (x.id ?? x._id) !== id);
          if (state.pagination) {
            state.pagination.total = Math.max(0, state.pagination.total - 1);
          }
        }
        if (state.current && (state.current.id ?? state.current._id) === id) {
          state.current = null;
        }
      });
  },
});

export const { clearCurrentCompany } = companySlice.actions;
export default companySlice.reducer;

