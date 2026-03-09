import { createSlice } from "@reduxjs/toolkit";
import {
    activateBill,
    createBill,
    createBillForAddress,
    getBillsForAddress,
    deleteBill,
    suspendBill,
    updateBill,
    getBill,
    getBillsByEstate,
    type BillsForAddressItem,
} from './bills';


interface BillData {
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

export interface AllBillsResponse {
  success: boolean;
  message: string;
  data: BillData[];
  pagination: Pagination;
}


export interface BillState {
    activateBillState: "idle" | "isLoading" | "succeeded" | "failed";
    createBillState: "idle" | "isLoading" | "succeeded" | "failed";
    createBillForAddressState: "idle" | "isLoading" | "succeeded" | "failed";
    deleteBillState: "idle" | "isLoading" | "succeeded" | "failed";
    suspendBillState: "idle" | "isLoading" | "succeeded" | "failed";
    updateBillState: "idle" | "isLoading" | "succeeded" | "failed";
    getBillState: "idle" | "isLoading" | "succeeded" | "failed";
    getBillsByEstateState: "idle" | "isLoading" | "succeeded" | "failed";
    getBillsForAddressState: "idle" | "isLoading" | "succeeded" | "failed";
    status: "idle" | "isLoading" | "succeeded" | "failed";
    bill: BillData | null;
    allBills: AllBillsResponse | null;
    assignedBills: BillsForAddressItem[];
    assignedBillsPagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    } | null;
    error: string | null;
}


const initialState: BillState = {
    activateBillState: "idle",
    createBillState: "idle",
    createBillForAddressState: "idle",
    deleteBillState: "idle",
    suspendBillState: "idle",
    updateBillState: "idle",
    getBillState: "idle",
    getBillsByEstateState: "idle",
    getBillsForAddressState: "idle",
    status: "idle",
    bill: null,
    allBills: null,
    assignedBills: [],
    assignedBillsPagination: null,
    error: null,
};


const billSlice = createSlice({
    name: "bills",
    initialState,
    reducers: {
        resetBillState: (state) => {
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
                state.allBills = {
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

        // ✅ GET BILLS FOR ADDRESS
        builder
            .addCase(getBillsForAddress.pending, (state) => {
                state.getBillsForAddressState = "isLoading";
            })
            .addCase(getBillsForAddress.fulfilled, (state, action) => {
                state.getBillsForAddressState = "succeeded";
                state.assignedBills = Array.isArray(action.payload?.data)
                    ? (action.payload.data as BillsForAddressItem[])
                    : [];
                state.assignedBillsPagination = action.payload?.pagination ?? null;
            })
            .addCase(getBillsForAddress.rejected, (state, action) => {
                state.getBillsForAddressState = "failed";
                state.assignedBills = [];
                state.assignedBillsPagination = null;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    action.error.message ||
                    "Failed to fetch bills for address";
            });


        // ✅ GET SINGLE BILL
        builder
            .addCase(getBill.pending, (state) => {
                state.getBillState = "isLoading";
            })
            .addCase(getBill.fulfilled, (state, action) => {
                state.getBillState = "succeeded";
                state.bill = action.payload?.data || null;
            })
            .addCase(getBill.rejected, (state, action) => {
                state.getBillState = "failed";
                state.error = action.error.message || "Failed to fetch bill";
            });


        // ✅ CREATE Bill
        builder
            .addCase(createBill.pending, (state) => {
                state.createBillState = "isLoading";
            })
            .addCase(createBill.fulfilled, (state, action) => {
                state.createBillState = "succeeded";
                const newBill = action.payload?.data;
                if (newBill) {
                    if (state.allBills?.data) {
                    state.allBills.data.push(newBill);
                    state.allBills.pagination.total += 1;
                    } else {
                    state.allBills = {
                        success: true,
                        message: "Bill created successfully",
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
            .addCase(createBill.rejected, (state, action) => {
                state.createBillState = "failed";
                state.error =
                    action.error.message || "Failed to create estate bill";
            });

        // ✅ CREATE BILL FOR ADDRESS
        builder
            .addCase(createBillForAddress.pending, (state) => {
                state.createBillForAddressState = "isLoading";
            })
            .addCase(createBillForAddress.fulfilled, (state) => {
                state.createBillForAddressState = "succeeded";
            })
            .addCase(createBillForAddress.rejected, (state, action) => {
                state.createBillForAddressState = "failed";
                state.error =
                    (action.payload as { message?: string })?.message ||
                    action.error.message ||
                    "Failed to create bill for address";
            });


        
        // ✅ UPDATE BILL
        builder
            .addCase(updateBill.pending, (state) => {
                state.updateBillState = "isLoading";
            })
            .addCase(updateBill.fulfilled, (state, action) => {
                state.updateBillState = "succeeded";
                const updated = action.payload?.data;
                if (updated && state.allBills?.data) {
                    state.allBills.data = state.allBills.data.map((bill) =>
                    bill.id === updated.id ? updated : bill
                    );
                }
            })
            .addCase(updateBill.rejected, (state, action) => {
                state.updateBillState = "failed";
                state.error =
                    action.error.message || "Failed to update estate bill";
            });


        // ✅ DELETE BILL
        builder
            .addCase(deleteBill.pending, (state) => {
                state.deleteBillState = "isLoading";
            })
            .addCase(deleteBill.fulfilled, (state, action) => {
                state.deleteBillState = "succeeded";
                const deletedId = action.meta.arg;
                if (state.allBills?.data) {
                    state.allBills.data = state.allBills.data.filter(
                    (bill) => bill.id !== deletedId
                    );
                    state.allBills.pagination.total -= 1;
                }
            })
            .addCase(deleteBill.rejected, (state, action) => {
                state.deleteBillState = "failed";
                state.error = action.error.message || "Failed to delete estate bill";
            });


        // ✅ ACTIVATE BILL
        builder
            .addCase(activateBill.pending, (state) => {
            state.activateBillState = "isLoading";
            })
            .addCase(activateBill.fulfilled, (state, action) => {
            state.activateBillState = "succeeded";
            const updated = action.payload?.data;
            if (updated && state.allBills?.data) {
                state.allBills.data = state.allBills.data.map((est) =>
                est.id === updated.id ? updated : est
                );
            }
            })
            .addCase(activateBill.rejected, (state, action) => {
            state.activateBillState = "failed";
            state.error = action.error.message || "Failed to activate estate bill";
            });


        // ✅ SUSPEND BILL
        builder
            .addCase(suspendBill.pending, (state) => {
                state.suspendBillState = "isLoading";
            })
            .addCase(suspendBill.fulfilled, (state, action) => {
                state.suspendBillState = "succeeded";
                const updated = action.payload?.data;
                if (updated && state.allBills?.data) {
                    state.allBills.data = state.allBills.data.map((est) =>
                    est.id === updated.id ? updated : est
                    );
                }
            })
            .addCase(suspendBill.rejected, (state, action) => {
                state.suspendBillState = "failed";
                state.error = action.error.message || "Failed to suspend estate bill";
            });
    },
});


export const { resetBillState } = billSlice.actions;
export default billSlice.reducer;