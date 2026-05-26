import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import {
  getCompanyOperationsReportingEntries,
  getCompanyOperationsReportingFields,
  getCompanyOperationsReportingTypes,
  type ApiPagination,
  type CompanyOperationsReportingEntry,
  type CompanyOperationsReportingField,
  type CompanyOperationsReportingType,
} from "./company-operations-reporting";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyOperationsReportingState {
  types: CompanyOperationsReportingType[];
  typesPagination: ApiPagination | null;
  fields: CompanyOperationsReportingField[];
  fieldsPagination: ApiPagination | null;
  entries: CompanyOperationsReportingEntry[];
  entriesPagination: ApiPagination | null;
  selectedEstateId: string | null;
  selectedTypeId: string | null;
  selectedFieldId: string | null;
  getTypesStatus: AsyncStatus;
  getFieldsStatus: AsyncStatus;
  getEntriesStatus: AsyncStatus;
  error: string | null;
}

const initialState: CompanyOperationsReportingState = {
  types: [],
  typesPagination: null,
  fields: [],
  fieldsPagination: null,
  entries: [],
  entriesPagination: null,
  selectedEstateId: null,
  selectedTypeId: null,
  selectedFieldId: null,
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
    setCompanySelectedEstate: (state, action) => {
      state.selectedEstateId = action.payload;
      state.types = [];
      state.fields = [];
      state.entries = [];
      state.selectedTypeId = null;
      state.selectedFieldId = null;
    },
    setCompanySelectedType: (state, action) => {
      state.selectedTypeId = action.payload;
      state.fields = [];
      state.entries = [];
      state.selectedFieldId = null;
    },
    setCompanySelectedField: (state, action) => {
      state.selectedFieldId = action.payload;
      state.entries = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCompanyOperationsReportingTypes.pending, (state) => {
        state.getTypesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyOperationsReportingTypes.fulfilled, (state, action) => {
        state.getTypesStatus = "succeeded";
        state.types = action.payload?.data ?? [];
        state.typesPagination = action.payload?.pagination ?? null;
      })
      .addCase(getCompanyOperationsReportingTypes.rejected, (state, action) => {
        state.getTypesStatus = "failed";
        state.types = [];
        state.typesPagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch reporting types";
      })
      .addCase(getCompanyOperationsReportingFields.pending, (state) => {
        state.getFieldsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyOperationsReportingFields.fulfilled, (state, action) => {
        state.getFieldsStatus = "succeeded";
        state.fields = action.payload?.data ?? [];
        state.fieldsPagination = action.payload?.pagination ?? null;
      })
      .addCase(getCompanyOperationsReportingFields.rejected, (state, action) => {
        state.getFieldsStatus = "failed";
        state.fields = [];
        state.fieldsPagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch reporting fields";
      })
      .addCase(getCompanyOperationsReportingEntries.pending, (state) => {
        state.getEntriesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyOperationsReportingEntries.fulfilled, (state, action) => {
        state.getEntriesStatus = "succeeded";
        state.entries = action.payload?.data ?? [];
        state.entriesPagination = action.payload?.pagination ?? null;
      })
      .addCase(getCompanyOperationsReportingEntries.rejected, (state, action) => {
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
  setCompanySelectedEstate,
  setCompanySelectedType,
  setCompanySelectedField,
} = companyOperationsReportingSlice.actions;

export default companyOperationsReportingSlice.reducer;

export const selectCompanyOperationsReporting = (state: RootState) =>
  (state.companyOperationsReporting as
    | CompanyOperationsReportingState
    | undefined) ?? initialState;
