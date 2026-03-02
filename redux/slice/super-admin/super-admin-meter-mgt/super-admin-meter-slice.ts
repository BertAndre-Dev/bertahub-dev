import { createSlice } from "@reduxjs/toolkit";
import {
    assignMeterToEstate,
    getAllMeters,
    reAssignMeter,
    removeEstateMeter,
    getMeter,
    getMeterByAddressId,
    deleteMeter
} from './super-admin-meter';


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

interface SuperAdminMeterData {
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


export interface SuperAdminMeterResponse {
  success: boolean;
  message: string;
  data: SuperAdminMeterData[];
  pagination: Pagination;
}


export interface SuperAdminMeterState {
    assignMeterToEstateState: "idle" | "isLoading" | "succeeded" | "failed";
    getAllMetersState: "idle" | "isLoading" | "succeeded" | "failed";
    reAssignMeterState: "idle" | "isLoading" | "succeeded" | "failed";
    removeEstateMeterState: "idle" | "isLoading" | "succeeded" | "failed";
    getMeterState: "idle" | "isLoading" | "succeeded" | "failed";
    getMeterByAddressIdState: "idle" | "isLoading" | "succeeded" | "failed";
    deleteMeterState: "idle" | "isLoading" | "succeeded" | "failed";
    status: "idle" | "isLoading" | "succeeded" | "failed";
    superAdminMeter: SuperAdminMeterData | null;
    allSuperAdminMeter: SuperAdminMeterResponse | null;
    error: string | null;
}


const initialState: SuperAdminMeterState = {
    assignMeterToEstateState: "idle",
    getAllMetersState: "idle",
    reAssignMeterState: "idle",
    removeEstateMeterState: "idle",
    getMeterState: "idle",
    getMeterByAddressIdState: "idle",
    deleteMeterState: "idle",
    status: "idle",
    superAdminMeter: null,
    allSuperAdminMeter: null,
    error: null,
}


const superAdminMeterSlice = createSlice({
    name: 'superAdminMeter',
    initialState,
    reducers: {
        resetSuperAdminMeterState: (state) => {
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers(builder) {
        // ✅ ASSIGN METER TO ESTATE & SAVE ON DB
        builder
            .addCase(assignMeterToEstate.pending, (state) => {
                state.assignMeterToEstateState = "isLoading";
            })
            .addCase(assignMeterToEstate.fulfilled, (state, action) => {
                state.assignMeterToEstateState = "succeeded";
                const newMeter = action.payload?.data;
                if (newMeter) {
                    if (state.allSuperAdminMeter?.data) {
                        state.allSuperAdminMeter.data.push(newMeter);
                        state.allSuperAdminMeter.pagination.total += 1;
                    } else {
                        state.allSuperAdminMeter = {
                            success: true,
                            message: "Meter assigned to estate successfully",
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
            .addCase(assignMeterToEstate.rejected, (state, action) => {
                state.assignMeterToEstateState = "failed";
                state.error =
                    (action.payload as any)?.message ||
                    action.error.message ||
                    "Failed to assign meter to estate";
            });



        // ✅ GET ALL METERS
        builder
            .addCase(getAllMeters.pending, (state) => {
                state.getAllMetersState = "isLoading";
                state.status = "isLoading";
            })
            .addCase(getAllMeters.fulfilled, (state, action) => {
                state.getAllMetersState = "succeeded";
                state.status = "succeeded";

                const pagination = action.payload?.pagination;
                state.allSuperAdminMeter = {
                    success: action.payload?.success ?? true,
                    message: action.payload?.message ?? "All meters retrieved successfully.",
                    data: action.payload?.data || [],
                    pagination: {
                        total: pagination?.total ?? (action.payload?.data?.length ?? 0),
                        currentPage: Number(pagination?.currentPage) || 1,
                        totalPages: Number(pagination?.totalPages) || 1,
                        pageSize: Number(pagination?.pageSize) || 10,
                    },
                };
            })

            .addCase(getAllMeters.rejected, (state, action) => {
                state.getAllMetersState = "failed";
                state.status = "failed";
                state.error = action.error.message || "Failed to fetch meters";
            });


        // ✅ REMOVE METER
        builder
            .addCase(removeEstateMeter.pending, (state) => {
                state.removeEstateMeterState = "isLoading";
            })
            .addCase(removeEstateMeter.fulfilled, (state, action) => {
                state.removeEstateMeterState = "succeeded";
                const remove = action.payload?.data;
                if (remove && state.allSuperAdminMeter?.data) {
                    state.allSuperAdminMeter.data = state.allSuperAdminMeter.data.map((meter) =>
                    meter.id === remove.id ? remove : meter
                    );
                }
            })
            .addCase(removeEstateMeter.rejected, (state, action) => {
                state.removeEstateMeterState = "failed";
                state.error =
                    action.error.message || "Failed to remove meter";
            });


        // ✅ REASSIGN METER
        builder
            .addCase(reAssignMeter.pending, (state) => {
                state.reAssignMeterState = "isLoading";
            })
            .addCase(reAssignMeter.fulfilled, (state, action) => {
                state.reAssignMeterState = "succeeded";
                const reassign = action.payload?.data;
                if (reassign && state.allSuperAdminMeter?.data) {
                    state.allSuperAdminMeter.data = state.allSuperAdminMeter.data.map((meter) =>
                    meter.id === reassign.id ? reassign : meter
                    );
                }
            })
            .addCase(reAssignMeter.rejected, (state, action) => {
                state.reAssignMeterState = "failed";
                state.error =
                    action.error.message || "Failed to reassign meter";
            });


        // ✅ GET SINGLE METER
        builder
            .addCase(getMeter.pending, (state) => {
                state.getMeterState = "isLoading";
            })
            .addCase(getMeter.fulfilled, (state, action) => {
                state.getMeterState = "succeeded";
                state.superAdminMeter = action.payload?.data || null;
            })
            .addCase(getMeter.rejected, (state, action) => {
                state.getMeterState = "failed";
                state.error = action.error.message || "Failed to fetch meter";
            });

        // ✅ GET METER BY ADDRESS ID (View details)
        builder
            .addCase(getMeterByAddressId.pending, (state) => {
                state.getMeterByAddressIdState = "isLoading";
            })
            .addCase(getMeterByAddressId.fulfilled, (state, action) => {
                state.getMeterByAddressIdState = "succeeded";
                state.superAdminMeter = action.payload?.data ?? null;
            })
            .addCase(getMeterByAddressId.rejected, (state, action) => {
                state.getMeterByAddressIdState = "failed";
                state.superAdminMeter = null;
                state.error = (action.payload as any)?.message ?? action.error.message ?? "Failed to fetch meter details";
            });


        // ✅ DELETE SINGLE METER
        builder
            .addCase(deleteMeter.pending, (state) => {
                state.deleteMeterState = "isLoading";
            })
            .addCase(deleteMeter.fulfilled, (state, action) => {
                state.deleteMeterState = "succeeded";

                const deletedMeterId = action.meta.arg; // 👈 meterId passed to thunk

                if (state.allSuperAdminMeter?.data) {
                    state.allSuperAdminMeter.data =
                    state.allSuperAdminMeter.data.filter(
                        (meter) => meter.id !== deletedMeterId
                    );

                    // ✅ keep pagination in sync
                    state.allSuperAdminMeter.pagination.total -= 1;
                }
            })

            .addCase(deleteMeter.rejected, (state, action) => {
                state.deleteMeterState = "failed";
                state.error = action.error.message || "Failed to delete meter";
            });
        
            
    },
});


export const { resetSuperAdminMeterState } = superAdminMeterSlice.actions;
export default superAdminMeterSlice.reducer;