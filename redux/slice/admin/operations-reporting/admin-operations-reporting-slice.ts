import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import {
  createOperationsReportingEntry,
  createOperationsReportingField,
  createOperationsReportingType,
  deleteOperationsReportingEntry,
  deleteOperationsReportingField,
  deleteOperationsReportingType,
  getOperationsReportingEntries,
  getOperationsReportingFields,
  getOperationsReportingTypes,
  updateOperationsReportingEntry,
  updateOperationsReportingField,
  updateOperationsReportingType,
  type ApiPagination,
  type OperationsReportingEntry,
  type OperationsReportingField,
  type OperationsReportingType,
} from "./admin-operations-reporting";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface AdminOperationsReportingState {
  types: OperationsReportingType[];
  typesPagination: ApiPagination | null;
  fields: OperationsReportingField[];
  fieldsPagination: ApiPagination | null;
  entries: OperationsReportingEntry[];
  entriesPagination: ApiPagination | null;
  selectedTypeId: string | null;
  selectedFieldId: string | null;
  getTypesStatus: AsyncStatus;
  createTypeStatus: AsyncStatus;
  updateTypeStatus: AsyncStatus;
  deleteTypeStatus: AsyncStatus;
  getFieldsStatus: AsyncStatus;
  createFieldStatus: AsyncStatus;
  updateFieldStatus: AsyncStatus;
  deleteFieldStatus: AsyncStatus;
  getEntriesStatus: AsyncStatus;
  createEntryStatus: AsyncStatus;
  updateEntryStatus: AsyncStatus;
  deleteEntryStatus: AsyncStatus;
  error: string | null;
}

const initialState: AdminOperationsReportingState = {
  types: [],
  typesPagination: null,
  fields: [],
  fieldsPagination: null,
  entries: [],
  entriesPagination: null,
  selectedTypeId: null,
  selectedFieldId: null,
  getTypesStatus: "idle",
  createTypeStatus: "idle",
  updateTypeStatus: "idle",
  deleteTypeStatus: "idle",
  getFieldsStatus: "idle",
  createFieldStatus: "idle",
  updateFieldStatus: "idle",
  deleteFieldStatus: "idle",
  getEntriesStatus: "idle",
  createEntryStatus: "idle",
  updateEntryStatus: "idle",
  deleteEntryStatus: "idle",
  error: null,
};

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

const adminOperationsReportingSlice = createSlice({
  name: "adminOperationsReporting",
  initialState,
  reducers: {
    clearAdminOperationsReportingError: (state) => {
      state.error = null;
    },
    setSelectedOperationsReportingType: (state, action) => {
      state.selectedTypeId = action.payload;
      state.fields = [];
      state.selectedFieldId = null;
      state.entries = [];
    },
    setSelectedOperationsReportingField: (state, action) => {
      state.selectedFieldId = action.payload;
      state.entries = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getOperationsReportingTypes.pending, (state) => {
        state.getTypesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getOperationsReportingTypes.fulfilled, (state, action) => {
        state.getTypesStatus = "succeeded";
        state.types = action.payload?.data ?? [];
        state.typesPagination = action.payload?.pagination ?? null;
      })
      .addCase(getOperationsReportingTypes.rejected, (state, action) => {
        state.getTypesStatus = "failed";
        state.types = [];
        state.typesPagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch reporting types";
      })
      .addCase(createOperationsReportingType.pending, (state) => {
        state.createTypeStatus = "isLoading";
        state.error = null;
      })
      .addCase(createOperationsReportingType.fulfilled, (state, action) => {
        state.createTypeStatus = "succeeded";
        const created = action.payload?.data;
        if (created) state.types = [created, ...state.types];
      })
      .addCase(createOperationsReportingType.rejected, (state, action) => {
        state.createTypeStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to create reporting type";
      })
      .addCase(updateOperationsReportingType.pending, (state) => {
        state.updateTypeStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateOperationsReportingType.fulfilled, (state, action) => {
        state.updateTypeStatus = "succeeded";
        const typeId = (action.payload as { typeId?: string })?.typeId ?? "";
        const updated = (action.payload as { data?: OperationsReportingType })
          ?.data;
        if (typeId) {
          state.types = state.types.map((t) =>
            getId(t) === typeId ? { ...t, ...updated, id: typeId } : t,
          );
        }
      })
      .addCase(updateOperationsReportingType.rejected, (state, action) => {
        state.updateTypeStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to update reporting type";
      })
      .addCase(deleteOperationsReportingType.pending, (state) => {
        state.deleteTypeStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteOperationsReportingType.fulfilled, (state, action) => {
        state.deleteTypeStatus = "succeeded";
        const id = (action.payload as { deletedTypeId?: string })?.deletedTypeId;
        if (id) {
          state.types = state.types.filter((t) => getId(t) !== id);
          if (state.selectedTypeId === id) {
            state.selectedTypeId = null;
            state.fields = [];
            state.selectedFieldId = null;
            state.entries = [];
          }
        }
      })
      .addCase(deleteOperationsReportingType.rejected, (state, action) => {
        state.deleteTypeStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to delete reporting type";
      })
      .addCase(getOperationsReportingFields.pending, (state) => {
        state.getFieldsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getOperationsReportingFields.fulfilled, (state, action) => {
        state.getFieldsStatus = "succeeded";
        state.fields = action.payload?.data ?? [];
        state.fieldsPagination = action.payload?.pagination ?? null;
      })
      .addCase(getOperationsReportingFields.rejected, (state, action) => {
        state.getFieldsStatus = "failed";
        state.fields = [];
        state.fieldsPagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch reporting fields";
      })
      .addCase(createOperationsReportingField.pending, (state) => {
        state.createFieldStatus = "isLoading";
        state.error = null;
      })
      .addCase(createOperationsReportingField.fulfilled, (state, action) => {
        state.createFieldStatus = "succeeded";
        const created = action.payload?.data;
        if (created) state.fields = [created, ...state.fields];
      })
      .addCase(createOperationsReportingField.rejected, (state, action) => {
        state.createFieldStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to create reporting field";
      })
      .addCase(updateOperationsReportingField.pending, (state) => {
        state.updateFieldStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateOperationsReportingField.fulfilled, (state, action) => {
        state.updateFieldStatus = "succeeded";
        const fieldId = (action.payload as { fieldId?: string })?.fieldId ?? "";
        const updated = (action.payload as { data?: OperationsReportingField })
          ?.data;
        if (fieldId) {
          state.fields = state.fields.map((f) =>
            getId(f) === fieldId ? { ...f, ...updated, id: fieldId } : f,
          );
        }
      })
      .addCase(updateOperationsReportingField.rejected, (state, action) => {
        state.updateFieldStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to update reporting field";
      })
      .addCase(deleteOperationsReportingField.pending, (state) => {
        state.deleteFieldStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteOperationsReportingField.fulfilled, (state, action) => {
        state.deleteFieldStatus = "succeeded";
        const id = (action.payload as { deletedFieldId?: string })
          ?.deletedFieldId;
        if (id) {
          state.fields = state.fields.filter((f) => getId(f) !== id);
          if (state.selectedFieldId === id) {
            state.selectedFieldId = null;
            state.entries = [];
          }
        }
      })
      .addCase(deleteOperationsReportingField.rejected, (state, action) => {
        state.deleteFieldStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to delete reporting field";
      })
      .addCase(getOperationsReportingEntries.pending, (state) => {
        state.getEntriesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getOperationsReportingEntries.fulfilled, (state, action) => {
        state.getEntriesStatus = "succeeded";
        state.entries = action.payload?.data ?? [];
        state.entriesPagination = action.payload?.pagination ?? null;
      })
      .addCase(getOperationsReportingEntries.rejected, (state, action) => {
        state.getEntriesStatus = "failed";
        state.entries = [];
        state.entriesPagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch report entries";
      })
      .addCase(createOperationsReportingEntry.pending, (state) => {
        state.createEntryStatus = "isLoading";
        state.error = null;
      })
      .addCase(createOperationsReportingEntry.fulfilled, (state, action) => {
        state.createEntryStatus = "succeeded";
        const created = action.payload?.data;
        if (created) state.entries = [created, ...state.entries];
      })
      .addCase(createOperationsReportingEntry.rejected, (state, action) => {
        state.createEntryStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to create report entry";
      })
      .addCase(updateOperationsReportingEntry.pending, (state) => {
        state.updateEntryStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateOperationsReportingEntry.fulfilled, (state, action) => {
        state.updateEntryStatus = "succeeded";
        const entryId = (action.payload as { entryId?: string })?.entryId ?? "";
        const updated = (action.payload as { data?: OperationsReportingEntry })
          ?.data;
        if (entryId) {
          state.entries = state.entries.map((e) =>
            getId(e) === entryId ? { ...e, ...updated, id: entryId } : e,
          );
        }
      })
      .addCase(updateOperationsReportingEntry.rejected, (state, action) => {
        state.updateEntryStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to update report entry";
      })
      .addCase(deleteOperationsReportingEntry.pending, (state) => {
        state.deleteEntryStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteOperationsReportingEntry.fulfilled, (state, action) => {
        state.deleteEntryStatus = "succeeded";
        const id = (action.payload as { deletedEntryId?: string })
          ?.deletedEntryId;
        if (id) state.entries = state.entries.filter((e) => getId(e) !== id);
      })
      .addCase(deleteOperationsReportingEntry.rejected, (state, action) => {
        state.deleteEntryStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to delete report entry";
      });
  },
});

export const {
  clearAdminOperationsReportingError,
  setSelectedOperationsReportingType,
  setSelectedOperationsReportingField,
} = adminOperationsReportingSlice.actions;

export default adminOperationsReportingSlice.reducer;

export const selectAdminOperationsReporting = (state: RootState) =>
  (state.adminOperationsReporting as AdminOperationsReportingState | undefined) ??
  initialState;
