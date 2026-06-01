import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

import {
  fetchCompanyOperationsReportingEntries,
  fetchCompanyOperationsReportingFields,
  fetchCompanyOperationsReportingTypes,
  type ApiPagination,
  type CompanyOperationsReportingEntry,
  type CompanyOperationsReportingField,
  type CompanyOperationsReportingType,
} from "./company-operations-reporting";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyOperationsReportingState {
  estateId: string | null;
  types: CompanyOperationsReportingType[];
  fields: CompanyOperationsReportingField[];
  entries: CompanyOperationsReportingEntry[];
  typesPagination: ApiPagination | null;
  fieldsPagination: ApiPagination | null;
  entriesPagination: ApiPagination | null;
  getTypesStatus: AsyncStatus;
  getFieldsStatus: AsyncStatus;
  getEntriesStatus: AsyncStatus;
  error: string | null;
}

const initialState: CompanyOperationsReportingState = {
  estateId: null,
  types: [],
  fields: [],
  entries: [],
  typesPagination: null,
  fieldsPagination: null,
  entriesPagination: null,
  getTypesStatus: "idle",
  getFieldsStatus: "idle",
  getEntriesStatus: "idle",
  error: null,
};

const companyOperationsReportingSlice = createSlice({
  name: "companyOperationsReporting",
  initialState,
  reducers: {
    clearCompanyOperationsReportingError: (state) => {
      state.error = null;
    },
    setCompanyOperationsReportingEstate: (state, action: { payload: string }) => {
      state.estateId = action.payload;
      state.types = [];
      state.fields = [];
      state.entries = [];
      state.typesPagination = null;
      state.fieldsPagination = null;
      state.entriesPagination = null;
      state.getTypesStatus = "idle";
      state.getFieldsStatus = "idle";
      state.getEntriesStatus = "idle";
      state.error = null;
    },
    resetCompanyOperationsReportingFields: (state) => {
      state.fields = [];
      state.entries = [];
      state.fieldsPagination = null;
      state.entriesPagination = null;
      state.getFieldsStatus = "idle";
      state.getEntriesStatus = "idle";
    },
    resetCompanyOperationsReportingEntries: (state) => {
      state.entries = [];
      state.entriesPagination = null;
      state.getEntriesStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyOperationsReportingTypes.pending, (state) => {
        state.getTypesStatus = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyOperationsReportingTypes.fulfilled, (state, action) => {
        state.getTypesStatus = "succeeded";
        state.types = action.payload?.data ?? [];
        state.typesPagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchCompanyOperationsReportingTypes.rejected, (state, action) => {
        state.getTypesStatus = "failed";
        state.types = [];
        state.typesPagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch reporting types";
      });

    builder
      .addCase(fetchCompanyOperationsReportingFields.pending, (state) => {
        state.getFieldsStatus = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyOperationsReportingFields.fulfilled, (state, action) => {
        state.getFieldsStatus = "succeeded";
        state.fields = action.payload?.data ?? [];
        state.fieldsPagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchCompanyOperationsReportingFields.rejected, (state, action) => {
        state.getFieldsStatus = "failed";
        state.fields = [];
        state.fieldsPagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch report fields";
      });

    builder
      .addCase(fetchCompanyOperationsReportingEntries.pending, (state) => {
        state.getEntriesStatus = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyOperationsReportingEntries.fulfilled, (state, action) => {
        state.getEntriesStatus = "succeeded";
        state.entries = action.payload?.data ?? [];
        state.entriesPagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchCompanyOperationsReportingEntries.rejected, (state, action) => {
        state.getEntriesStatus = "failed";
        state.entries = [];
        state.entriesPagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch report entries";
      });
  },
});

export const {
  clearCompanyOperationsReportingError,
  setCompanyOperationsReportingEstate,
  resetCompanyOperationsReportingFields,
  resetCompanyOperationsReportingEntries,
} = companyOperationsReportingSlice.actions;

export default companyOperationsReportingSlice.reducer;

export const selectCompanyOperationsReporting = (state: RootState) =>
  (state.companyOperationsReporting as CompanyOperationsReportingState | undefined) ??
  initialState;
