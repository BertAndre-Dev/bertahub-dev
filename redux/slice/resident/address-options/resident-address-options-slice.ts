import { createSlice } from "@reduxjs/toolkit";
import {
  getResidentEstateFields,
  getResidentFieldEntries,
  getOwnerAddressesByEstate,
  type AddressOptionItem,
  type OwnerAddressItem,
} from "./resident-address-options";

export interface ResidentAddressOptionsState {
  /** Options for address dropdown (label, value = entry id) */
  options: AddressOptionItem[];
  /** Owner addresses from GET /address-mgt/owner/:estateId (used for invite-tenant) */
  ownerAddresses: OwnerAddressItem[];
  fieldsStatus: "idle" | "isLoading" | "succeeded" | "failed";
  entriesStatus: "idle" | "isLoading" | "succeeded" | "failed";
  ownerAddressesStatus: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ResidentAddressOptionsState = {
  options: [],
  ownerAddresses: [],
  fieldsStatus: "idle",
  entriesStatus: "idle",
  ownerAddressesStatus: "idle",
  error: null,
};

const residentAddressOptionsSlice = createSlice({
  name: "residentAddressOptions",
  initialState,
  reducers: {
    clearResidentAddressOptions: (state) => {
      state.options = [];
      state.ownerAddresses = [];
      state.fieldsStatus = "idle";
      state.entriesStatus = "idle";
      state.ownerAddressesStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getResidentEstateFields.pending, (state) => {
        state.fieldsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getResidentEstateFields.fulfilled, (state) => {
        state.fieldsStatus = "succeeded";
        state.error = null;
      })
      .addCase(getResidentEstateFields.rejected, (state, action) => {
        state.fieldsStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch address fields";
      })
      .addCase(getResidentFieldEntries.pending, (state) => {
        state.entriesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getResidentFieldEntries.fulfilled, (state, action) => {
        state.entriesStatus = "succeeded";
        state.error = null;
        const data = action.payload?.data ?? (action.payload as { data?: unknown[] })?.data ?? [];
        const list = Array.isArray(data) ? data : [];
        state.options = list.map((entry: { id?: string; data?: Record<string, string> }) => {
          const d = entry.data ?? {};
          const label = Object.entries(d)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
          return { label: label || entry.id || "", value: entry.id ?? "" };
        });
      })
      .addCase(getResidentFieldEntries.rejected, (state, action) => {
        state.entriesStatus = "failed";
        state.options = [];
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch address entries";
      })
      .addCase(getOwnerAddressesByEstate.pending, (state) => {
        state.ownerAddressesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getOwnerAddressesByEstate.fulfilled, (state, action) => {
        state.ownerAddressesStatus = "succeeded";
        state.error = null;
        state.ownerAddresses = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getOwnerAddressesByEstate.rejected, (state, action) => {
        state.ownerAddressesStatus = "failed";
        state.ownerAddresses = [];
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch owner addresses";
      });
  },
});

export const { clearResidentAddressOptions } = residentAddressOptionsSlice.actions;
export default residentAddressOptionsSlice.reducer;
