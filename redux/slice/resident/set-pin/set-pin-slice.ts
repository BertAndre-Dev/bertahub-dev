import { createSlice, type ActionReducerMapBuilder } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import {
  createBillPaymentPin,
  updateBillPaymentPin,
  type BillPinError,
} from "./set-pin";

// ─── Types ────────────────────────────────────────────────────────────────────

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export interface ResidentBillPinState {
  createStatus: AsyncStatus;
  updateStatus: AsyncStatus;
  hasBillPin: boolean;
  error: string | null;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: ResidentBillPinState = {
  createStatus: "idle",
  updateStatus: "idle",
  hasBillPin: false,
  error: null,
};

// ─── DRY Builder Helper ───────────────────────────────────────────────────────
// Reduces repetition across create/update thunk lifecycles.

type StatusKey = "createStatus" | "updateStatus";

function addPinThunkCases(
  builder: ActionReducerMapBuilder<ResidentBillPinState>,
  thunk: typeof createBillPaymentPin | typeof updateBillPaymentPin,
  statusKey: StatusKey,
  fallbackError: string,
) {
  builder
    .addCase(thunk.pending, (state) => {
      state[statusKey] = "loading";
      state.error = null;
    })
    .addCase(thunk.fulfilled, (state) => {
      state[statusKey] = "succeeded";
      state.hasBillPin = true;
    })
    .addCase(thunk.rejected, (state, action) => {
      state[statusKey] = "failed";
      state.error =
        (action.payload as BillPinError | undefined)?.message ??
        action.error.message ??
        fallbackError;
    });
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export const residentBillPinSlice = createSlice({
  name: "residentBillPin",
  initialState,
  reducers: {
    resetResidentBillPin: () => initialState,
    clearBillPinError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    addPinThunkCases(builder, createBillPaymentPin, "createStatus", "Failed to create bill payment PIN.");
    addPinThunkCases(builder, updateBillPaymentPin, "updateStatus", "Failed to update bill payment PIN.");
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────────

export const { resetResidentBillPin, clearBillPinError } =
  residentBillPinSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectHasBillPin = (state: RootState) =>
  state.residentBillPin.hasBillPin;

export const selectCreatePinStatus = (state: RootState) =>
  state.residentBillPin.createStatus;

export const selectUpdatePinStatus = (state: RootState) =>
  state.residentBillPin.updateStatus;

export const selectBillPinError = (state: RootState) =>
  state.residentBillPin.error;

export const selectIsCreatingPin = (state: RootState) =>
  state.residentBillPin.createStatus === "loading";

export const selectIsUpdatingPin = (state: RootState) =>
  state.residentBillPin.updateStatus === "loading";

export default residentBillPinSlice.reducer;