import { createSlice } from "@reduxjs/toolkit";
import {
  getMeterByAddress,
  vendPower,
  reconnectMeter,
  disconnectMeter,
} from "./meter-mgt";

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
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface ResidentMeterResponse {
  success: boolean;
  message: string;
  data: ResidentMeterData[];
  pagination: Pagination;
}

export interface ResidentMeterState {
  getMeterByAddressState: "idle" | "isLoading" | "succeeded" | "failed";
  vendPowerState: "idle" | "isLoading" | "succeeded" | "failed";
  reconnectMeterState: "idle" | "isLoading" | "succeeded" | "failed";
  disconnectMeterState: "idle" | "isLoading" | "succeeded" | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  residentMeter: ResidentMeterData | null;
  allResidentMeters: ResidentMeterResponse | null;
  error: string | null;
}

const initialState: ResidentMeterState = {
  getMeterByAddressState: "idle",
  vendPowerState: "idle",
  reconnectMeterState: "idle",
  disconnectMeterState: "idle",
  status: "idle",
  residentMeter: null,
  allResidentMeters: null,
  error: null,
};

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
    // ✅ GET METER BY ADDRESS
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

    // ✅ VEND POWER
    builder
      .addCase(vendPower.pending, (state) => {
        state.vendPowerState = "isLoading";
      })
      .addCase(vendPower.fulfilled, (state, action) => {
        state.vendPowerState = "succeeded";
        const newTras = action.payload?.data;
        if (newTras) {
          if (state.allResidentMeters?.data) {
            state.allResidentMeters.data.push(newTras);
            state.allResidentMeters.pagination.total += 1;
          } else {
            state.allResidentMeters = {
              success: true,
              message: "Vending successfully",
              data: [newTras],
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
      .addCase(vendPower.rejected, (state, action) => {
        state.vendPowerState = "failed";
        state.error = action.error.message || "Failed to vend";
      });

    // ✅ DISCONNECT METER
    builder
    .addCase(disconnectMeter.pending, (state) => {
        state.disconnectMeterState = "isLoading";
    })
    .addCase(disconnectMeter.fulfilled, (state, action) => {
        state.disconnectMeterState = "succeeded";
        if (state.residentMeter && state.residentMeter.id === action.payload?.data?.id) {
        state.residentMeter.isActive = false;
        }
    })
    .addCase(disconnectMeter.rejected, (state, action) => {
        state.disconnectMeterState = "failed";
        state.error = action.error.message || "Failed to disconnect meter";
    });

    // ✅ RECONNECT METER
    builder
    .addCase(reconnectMeter.pending, (state) => {
        state.reconnectMeterState = "isLoading";
    })
    .addCase(reconnectMeter.fulfilled, (state, action) => {
        state.reconnectMeterState = "succeeded";
        if (state.residentMeter && state.residentMeter.id === action.payload?.data?.id) {
        state.residentMeter.isActive = true;
        }
    })
    .addCase(reconnectMeter.rejected, (state, action) => {
        state.reconnectMeterState = "failed";
        state.error = action.error.message || "Failed to reconnect meter";
    });

  },
});

export const { resetResidentMeterState } = residentMeterSlice.actions;
export default residentMeterSlice.reducer;
