import { createSlice } from "@reduxjs/toolkit";
import {
  getMeterByAddress,
  vendPower,
  reconnectMeter,
  disconnectMeter,
  getMeterVendHistory,
} from "./meter-mgt";

//
// ──────────────────────────────────────────
//  INTERFACES
// ──────────────────────────────────────────
//

interface VendorData {
  name: string;
  device: string;
  refName: string;
  refCode: string;
  address: string;
  maxVend: string;
  minVend: string;
  status: number;
  utilityName: string;
  time: string;
}

export interface ResidentMeterData {
  id: string;
  meterNumber: string;
  isActive: boolean;
  isAssigned: boolean;
  estateId: string;
  lastCredit: number;
  createdAt: string;
  addressId: string;
  vendorData: VendorData;
}

export interface Pagination {
  total: number;
  page: string;
  limit: string;
  pages: number;
}

// ──────────────────────────────────────────
// VEND HISTORY
// ──────────────────────────────────────────

export interface MeterVendHistoryResponse {
  success: boolean;
  message: string;
  data: MeterVendHistoryItem[];
  pagination: Pagination;
}

export interface MeterVendHistoryItem {
  id: string;
  meterNumber: string;
  walletId: string;
  transId: string;
  amount: number;
  fullResponse: FullVendResponse;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface FullVendResponse {
  currencyType: string;
  amount: string;
  transTime: string;
  address: string;
  seed: string;
  transId: string;
  energyList: EnergyListItem[];
  feeList: FeeItem[];
  contact: string;
  receiptNo: string;
  name: string;
  state: number;
  utilityName: string;
  stampTax: string;
  debtList: DebtItem[];
}

export interface EnergyListItem {
  tt?: string;
  amount: string;
  krn?: string;
  sgc?: string;
  token?: string;
  taxRate: string;
  unit: string;
  at?: string;
  ti: string;
  price: string;
  receiptNo: string;
  taxAmount: string;
  tiDesc: string;
  device: string;
  value: string;
}

export interface FeeItem {
  [key: string]: any;
}

export interface DebtItem {
  [key: string]: any;
}

//
// ──────────────────────────────────────────
//   SLICE STATE
// ──────────────────────────────────────────
//

export interface ResidentMeterState {
  getMeterByAddressState: "idle" | "isLoading" | "succeeded" | "failed";
  vendPowerState: "idle" | "isLoading" | "succeeded" | "failed";
  reconnectMeterState: "idle" | "isLoading" | "succeeded" | "failed";
  disconnectMeterState: "idle" | "isLoading" | "succeeded" | "failed";
  getMeterVendHistoryState: "idle" | "isLoading" | "succeeded" | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  residentMeter: ResidentMeterData | null;
  meterVendHistory: MeterVendHistoryResponse | null;
  error: string | null;
}

const initialState: ResidentMeterState = {
  getMeterByAddressState: "idle",
  vendPowerState: "idle",
  reconnectMeterState: "idle",
  disconnectMeterState: "idle",
  getMeterVendHistoryState: "idle",
  status: "idle",
  residentMeter: null,
  meterVendHistory: null,
  error: null,
};

//
// ──────────────────────────────────────────
//   SLICE
// ──────────────────────────────────────────
//

const residentMeterSlice = createSlice({
  name: "residentMeter",
  initialState,
  reducers: {
    resetResidentMeterState: (state) => {
      state.status = "idle";
      state.error = null;
      state.reconnectMeterState = "idle";
      state.disconnectMeterState = "idle";
    },
  },

  extraReducers(builder) {
    //
    // ──────────────────────────────────────────────
    // GET METER BY ADDRESS
    // ──────────────────────────────────────────────
    //
    builder
      .addCase(getMeterByAddress.pending, (state) => {
        state.getMeterByAddressState = "isLoading";
      })
      .addCase(getMeterByAddress.fulfilled, (state, action) => {
        state.getMeterByAddressState = "succeeded";
        state.residentMeter = action.payload?.data || null;
      })
      .addCase(getMeterByAddress.rejected, (state, action) => {
        state.getMeterByAddressState = "failed";
        state.error = action.error.message || "Failed to fetch meter";
      });

    //
    // ──────────────────────────────────────────────
    // GET METER VEND HISTORY
    // ──────────────────────────────────────────────
    //
    builder
      .addCase(getMeterVendHistory.pending, (state) => {
        state.getMeterVendHistoryState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(getMeterVendHistory.fulfilled, (state, action) => {
        state.getMeterVendHistoryState = "succeeded";
        state.status = "succeeded";

        state.meterVendHistory = action.payload || {
          success: true,
          message: "History retrieved",
          data: [],
          pagination: {
            total: 0,
            page: "1",
            limit: "10",
            pages: 1,
          },
        };
      })
      .addCase(getMeterVendHistory.rejected, (state, action) => {
        state.getMeterVendHistoryState = "failed";
        state.status = "failed";
        state.error =
          action.error.message || "Failed to fetch meter vend history";
      });

    //
    // ──────────────────────────────────────────────
    // VEND POWER
    // ──────────────────────────────────────────────
    //
    builder
      .addCase(vendPower.pending, (state) => {
        state.vendPowerState = "isLoading";
      })
      .addCase(vendPower.fulfilled, (state, action) => {
        state.vendPowerState = "succeeded";
      })
      .addCase(vendPower.rejected, (state, action) => {
        state.vendPowerState = "failed";
        state.error = action.error.message || "Failed to vend";
      });

    //
    // ──────────────────────────────────────────────
    // DISCONNECT METER
    // ──────────────────────────────────────────────
    //
    builder
      .addCase(disconnectMeter.pending, (state) => {
        state.disconnectMeterState = "isLoading";
      })
      .addCase(disconnectMeter.fulfilled, (state, action) => {
        state.disconnectMeterState = "succeeded";
        if (
          state.residentMeter &&
          state.residentMeter.id === action.payload?.data?.id
        ) {
          state.residentMeter.isActive = false;
        }
      })
      .addCase(disconnectMeter.rejected, (state, action) => {
        state.disconnectMeterState = "failed";
        state.error = action.error.message || "Failed to disconnect meter";
      });

    //
    // ──────────────────────────────────────────────
    // RECONNECT METER
    // ──────────────────────────────────────────────
    //
    builder
      .addCase(reconnectMeter.pending, (state) => {
        state.reconnectMeterState = "isLoading";
      })
      .addCase(reconnectMeter.fulfilled, (state, action) => {
        state.reconnectMeterState = "succeeded";
        if (
          state.residentMeter &&
          state.residentMeter.id === action.payload?.data?.id
        ) {
          state.residentMeter.isActive = true;
        }
      })
      .addCase(reconnectMeter.rejected, (state, action) => {
        state.reconnectMeterState = "failed";
        state.error =
          action.error.message || "Failed to reconnect meter";
      });
  },
});

export const { resetResidentMeterState } = residentMeterSlice.actions;
export default residentMeterSlice.reducer;
