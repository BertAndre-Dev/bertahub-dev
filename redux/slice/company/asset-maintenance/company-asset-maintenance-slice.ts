import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import {
  activateAssetMaintenance,
  createAssetMaintenance,
  deleteAssetMaintenance,
  getAssetMaintenanceList,
  suspendAssetMaintenance,
  updateAssetMaintenance,
  type ApiPagination,
  type AssetMaintenanceRecord,
} from "./company-asset-maintenance";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyAssetMaintenanceState {
  records: AssetMaintenanceRecord[];
  pagination: ApiPagination | null;
  getListStatus: AsyncStatus;
  createStatus: AsyncStatus;
  updateStatus: AsyncStatus;
  deleteStatus: AsyncStatus;
  suspendStatus: AsyncStatus;
  activateStatus: AsyncStatus;
  error: string | null;
}

const initialState: CompanyAssetMaintenanceState = {
  records: [],
  pagination: null,
  getListStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  suspendStatus: "idle",
  activateStatus: "idle",
  error: null,
};

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

function mergeRecord(
  list: AssetMaintenanceRecord[],
  updated: AssetMaintenanceRecord | undefined,
  id: string,
) {
  if (!id) return list;
  const idx = list.findIndex((r) => getId(r) === id);
  if (idx === -1) return list;
  return list.map((r, i) => (i === idx ? { ...r, ...updated, id } : r));
}

const companyAssetMaintenanceSlice = createSlice({
  name: "companyAssetMaintenance",
  initialState,
  reducers: {
    clearCompanyAssetMaintenanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAssetMaintenanceList.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAssetMaintenanceList.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        state.records = action.payload?.data ?? [];
        state.pagination = action.payload?.pagination ?? null;
      })
      .addCase(getAssetMaintenanceList.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.records = [];
        state.pagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch maintenance records";
      })
      .addCase(createAssetMaintenance.pending, (state) => {
        state.createStatus = "isLoading";
        state.error = null;
      })
      .addCase(createAssetMaintenance.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const created = action.payload?.data;
        if (created) state.records = [created, ...state.records];
      })
      .addCase(createAssetMaintenance.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to create maintenance record";
      })
      .addCase(updateAssetMaintenance.pending, (state) => {
        state.updateStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateAssetMaintenance.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const payload = action.payload as {
          data?: AssetMaintenanceRecord;
          maintenanceId?: string;
        };
        const id = payload.maintenanceId ?? "";
        state.records = mergeRecord(state.records, payload.data, id);
      })
      .addCase(updateAssetMaintenance.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to update maintenance record";
      })
      .addCase(deleteAssetMaintenance.pending, (state) => {
        state.deleteStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteAssetMaintenance.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        const id = (action.payload as { deletedId?: string })?.deletedId;
        if (id) state.records = state.records.filter((r) => getId(r) !== id);
      })
      .addCase(deleteAssetMaintenance.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to delete maintenance record";
      })
      .addCase(suspendAssetMaintenance.pending, (state) => {
        state.suspendStatus = "isLoading";
      })
      .addCase(suspendAssetMaintenance.fulfilled, (state, action) => {
        state.suspendStatus = "succeeded";
        const id = (action.payload as { maintenanceId?: string })?.maintenanceId;
        if (id) {
          state.records = state.records.map((r) =>
            getId(r) === id ? { ...r, isActive: false } : r,
          );
        }
      })
      .addCase(suspendAssetMaintenance.rejected, (state, action) => {
        state.suspendStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to suspend record";
      })
      .addCase(activateAssetMaintenance.pending, (state) => {
        state.activateStatus = "isLoading";
      })
      .addCase(activateAssetMaintenance.fulfilled, (state, action) => {
        state.activateStatus = "succeeded";
        const id = (action.payload as { maintenanceId?: string })?.maintenanceId;
        if (id) {
          state.records = state.records.map((r) =>
            getId(r) === id ? { ...r, isActive: true } : r,
          );
        }
      })
      .addCase(activateAssetMaintenance.rejected, (state, action) => {
        state.activateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to activate record";
      });
  },
});

export const { clearCompanyAssetMaintenanceError } =
  companyAssetMaintenanceSlice.actions;
export default companyAssetMaintenanceSlice.reducer;

export const selectCompanyAssetMaintenance = (state: RootState) =>
  (state.companyAssetMaintenance as CompanyAssetMaintenanceState | undefined) ??
  initialState;
