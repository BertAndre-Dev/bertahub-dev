import { createSlice } from "@reduxjs/toolkit";
import {
    assignMeterToAddress,
    getAllEstateMeter,
    getMeter
} from './meter-mgt';


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

interface AdminMeterData {
  id?: string;
  meterNumber: string;
  isActive?: boolean;
  isAssigned?: boolean;
  estateId?: string;
  lastCredit?: number;
  createdAt?: string; 
  updatedAt?: string; 
  addressId: string;
  vendorData?: VendorData;
}


export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}


export interface AdminMeterResponse {
  success: boolean;
  message: string;
  data: AdminMeterData[];
  pagination: Pagination;
}


export interface AdminMeterState {
    assignMeterToAddressState: "idle" | "isLoading" | "succeeded" | "failed";
    getAllEstateMeterState: "idle" | "isLoading" | "succeeded" | "failed";
    getMeterState: "idle" | "isLoading" | "succeeded" | "failed";
    status: "idle" | "isLoading" | "succeeded" | "failed";
    adminMeter: AdminMeterData | null;
    allAdminMeters: AdminMeterResponse | null;
    error: string | null;
}


const initialState: AdminMeterState = {
    assignMeterToAddressState: "idle",
    getAllEstateMeterState: "idle",
    getMeterState: "idle",
    status: "idle",
    adminMeter: null,
    allAdminMeters: null,
    error: null,
}


const adminMeterSlice = createSlice({
    name: 'adminMeter',
    initialState,
    reducers: {
        resetAdminMeterState: (state) => {
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers(builder) {
        // ✅ ASSIGN METER TO ADDRESS
        builder
            .addCase(assignMeterToAddress.pending, (state) => {
                state.assignMeterToAddressState = "isLoading";
            })
            .addCase(assignMeterToAddress.fulfilled, (state, action) => {
                state.assignMeterToAddressState = "succeeded";
                const newMeter = action.payload?.data;
                if (newMeter) {
                    if (state.allAdminMeters?.data) {
                        state.allAdminMeters.data.push(newMeter);
                        state.allAdminMeters.pagination.total += 1;
                    } else {
                        state.allAdminMeters = {
                            success: true,
                            message: "Meter assigned successfully",
                            data: [newMeter],
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
            .addCase(assignMeterToAddress.rejected, (state, action) => {
                state.assignMeterToAddressState = "failed";
                state.error =
                    action.error.message || "Failed to assign meter";
            });


        // ✅ GET SINGLE METER
        builder
            .addCase(getMeter.pending, (state) => {
                state.getMeterState = "isLoading";
            })
            .addCase(getMeter.fulfilled, (state, action) => {
                state.getMeterState = "succeeded";
                state.adminMeter = action.payload?.data || null;
            })
            .addCase(getMeter.rejected, (state, action) => {
                state.getMeterState = "failed";
                state.error = action.error.message || "Failed to fetch meter";
            });



        // ✅ GET ESTATE METERS
        builder
            .addCase(getAllEstateMeter.pending, (state) => {
                state.getAllEstateMeterState = "isLoading";
                state.status = "isLoading";
            })
            .addCase(getAllEstateMeter.fulfilled, (state, action) => {
                state.getAllEstateMeterState = "succeeded";
                state.status = "succeeded";
                state.allAdminMeters = {
                    success: action.payload?.success ?? true,
                    message:
                        action.payload?.message ?? "Estate meters retrieved successfully.",
                    data: action.payload?.data || [],
                    pagination: action.payload?.pagination || {
                        total: action.payload?.data?.length ?? 0,
                        currentPage: 1,
                        totalPages: 1,
                        pageSize: 10,
                    },
                };
            })
            .addCase(getAllEstateMeter.rejected, (state, action) => {
                state.getAllEstateMeterState = "failed";
                state.status = "failed";
                state.error = action.error.message || "Failed to fetch estate meters";
            });
        
    },
});


export const { resetAdminMeterState } = adminMeterSlice.actions;
export default adminMeterSlice.reducer;
