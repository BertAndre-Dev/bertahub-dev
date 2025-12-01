import { createSlice } from "@reduxjs/toolkit";
import {
    getBill,
    getBillsByEstate,
    getResidentBills,
    payBill
} from './bills-mgt';


interface ResidentBillData {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
  isActive?: boolean;
}


export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface BillsResponse {
  success: boolean;
  message: string;
  data: ResidentBillData[];
  pagination: Pagination;
}


export interface ResidentBillState {
    getBillState: "idle" | "isLoading" | "succeeded" | "failed";
    getBillsByEstateState: "idle" | "isLoading" | "succeeded" | "failed";
    getResidentBillsState: "idle" | "isLoading" | "succeeded" | "failed";
    payBillState: "idle" | "isLoading" | "succeeded" | "failed";
    status: "idle" | "isLoading" | "succeeded" | "failed";
    residentBill: ResidentBillData | null;
    residentBills:  BillsResponse | null;
    error: string | null;
}


const initialState: ResidentBillState = {
    getBillState: "idle",
    getBillsByEstateState: "idle",
    getResidentBillsState: "idle",
    payBillState: "idle",
    status: "idle",
    residentBill: null,
    residentBills: null,
    error: null
};


const residentBillSlice = createSlice({
    name: 'residentBill',
    initialState,
    reducers: {
        resetResidentBillState: (state) => {
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers(builder) {
        // ✅ GET BILLS BY ESTATE
        builder
            .addCase(getBillsByEstate.pending, (state) => {
                state.getBillsByEstateState = "isLoading";
                state.status = "isLoading";
            })
            .addCase(getBillsByEstate.fulfilled, (state, action) => {
                state.getBillsByEstateState = "succeeded";
                state.status = "succeeded";
                state.residentBills = {
                    success: action.payload?.success ?? true,
                    message:
                    action.payload?.message ??
                    "Bills retrieved successfully.",
                    data: action.payload?.data || [],
                    pagination: action.payload?.pagination || {
                        total: action.payload?.data?.length ?? 0,
                        currentPage: 1,
                        totalPages: 1,
                        pageSize: 10,
                    },
                };
            })
            .addCase(getBillsByEstate.rejected, (state, action) => {
                state.getBillsByEstateState = "failed";
                state.status = "failed";
                state.error = action.error.message || "Failed to fetch bills for estate";
            });


        // ✅ GET RESIDENT BILL
        builder
            .addCase(getResidentBills.pending, (state) => {
                state.getResidentBillsState = "isLoading";
                state.status = "isLoading";
            })
            .addCase(getResidentBills.fulfilled, (state, action) => {
                state.getResidentBillsState = "succeeded";
                state.status = "succeeded";
                state.residentBills = {
                    success: action.payload?.success ?? true,
                    message:
                    action.payload?.message ??
                    "Bills retrieved successfully.",
                    data: action.payload?.data || [],
                    pagination: action.payload?.pagination || {
                        total: action.payload?.data?.length ?? 0,
                        currentPage: 1,
                        totalPages: 1,
                        pageSize: 10,
                    },
                };
            })
            .addCase(getResidentBills.rejected, (state, action) => {
                state.getResidentBillsState = "failed";
                state.status = "failed";
                state.error = action.error.message || "Failed to fetch bills for estate";
            });


        // ✅ GET SINGLE BILL
        builder
            .addCase(getBill.pending, (state) => {
                state.getBillState = "isLoading";
            })
            .addCase(getBill.fulfilled, (state, action) => {
                state.getBillState = "succeeded";
                state.residentBill = action.payload?.data || null;
            })
            .addCase(getBill.rejected, (state, action) => {
                state.getBillState = "failed";
                state.error = action.error.message || "Failed to fetch bill";
            });


        // ✅ CREATE Bill
        builder
            .addCase(payBill.pending, (state) => {
                state.payBillState = "isLoading";
            })
            .addCase(payBill.fulfilled, (state, action) => {
                state.payBillState = "succeeded";
                const newBill = action.payload?.data;
                if (newBill) {
                    if (state.residentBills?.data) {
                    state.residentBills.data.push(newBill);
                    state.residentBills.pagination.total += 1;
                    } else {
                    state.residentBills = {
                        success: true,
                        message: "Bill paid successfully",
                        data: [newBill],
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
            .addCase(payBill.rejected, (state, action) => {
                state.payBillState = "failed";
                state.error =
                    action.error.message || "Failed to create estate bill";
            });
        
    },
});

export const { resetResidentBillState } = residentBillSlice.actions;
export default residentBillSlice.reducer;