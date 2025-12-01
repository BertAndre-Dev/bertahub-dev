import { createSlice } from "@reduxjs/toolkit";
import {
    createEntry,
    deleteEntry,
    getEntry,
    updateEntry,
    getEntriesByField,
    getEntryStats
} from './entry';


interface EntryData {
  estateId: string;
  fieldId: string;
  data: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
}


export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}


export interface AllEntryResponse {
  success: boolean;
  message: string;
  data: EntryData[];
  pagination: Pagination;
}


export interface EntryStats {
  totalEntries: number;
  recentEntries: number;
  [key: string]: any; // dynamic fields depending on backend schema
}


export interface EntryState {
    createEntryState: "idle" | "isLoading" | "succeeded" | "failed";
    deleteEntryState: "idle" | "isLoading" | "succeeded" | "failed";
    getEntryState: "idle" | "isLoading" | "succeeded" | "failed";
    updateEntryState: "idle" | "isLoading" | "succeeded" | "failed";
    getEntriesByFieldState: "idle" | "isLoading" | "succeeded" | "failed";
    getEntryStatsState: "idle" | "isLoading" | "succeeded" | "failed";
    status: "idle" | "isLoading" | "succeeded" | "failed";
    entry: EntryData | null;
    allEntry: AllEntryResponse | null;
    stats: Record<string, EntryStats>; 
    error: string | null;
}


const initialState: EntryState = {
    createEntryState: 'idle',
    deleteEntryState: 'idle',
    getEntryState: 'idle',
    updateEntryState: 'idle',
    getEntriesByFieldState: 'idle',
    getEntryStatsState: 'idle',
    status: 'idle',
    entry: null,
    allEntry: null,
    stats: {},
    error: null,
} 


const entrySlice = createSlice({
    name: 'entry',
    initialState,
    reducers: {
        resetEntryState: (state) => {
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers(builder) {
        // 🔹 GET ENTRIES BY FIELDS
        builder
            .addCase(getEntriesByField.pending, (state) => {
                state.getEntriesByFieldState = "isLoading";
                state.status = "isLoading";
            })
            .addCase(getEntriesByField.fulfilled, (state, action) => {
                state.getEntriesByFieldState = "succeeded";
                state.status = "succeeded";
                // ✅ Now store both data and pagination
                state.allEntry = {
                    success: action.payload?.success ?? true,
                    message: action.payload?.message ?? "Field entries retrieved successfully",
                    data: action.payload?.data || [],
                    pagination: action.payload?.pagination || {
                    total: 0,
                    currentPage: 1,
                    totalPages: 1,
                    pageSize: 10,
                    },
                };
            })
            .addCase(getEntriesByField.rejected, (state, action) => {
                state.getEntriesByFieldState = "failed";
                state.status = "failed";
                state.error = action.error.message || "Failed to fetch field entries";
            });


        // 🔹 GET SINGLE FIELD
        builder
            .addCase(getEntry.pending, (state) => {
                state.getEntryState = "isLoading";
            })
            .addCase(getEntry.fulfilled, (state, action) => {
                state.getEntryState = "succeeded";
                state.entry = action.payload?.data || null;
            })
            .addCase(getEntry.rejected, (state, action) => {
                state.getEntryState = "failed";
                state.error = action.error.message || "Failed to fetch entry";
            });


        // 🔹 CREATE ESTATE ADDRESS FIELD
        builder
            .addCase(createEntry.pending, (state) => {
                state.createEntryState = "isLoading";
            })
            .addCase(createEntry.fulfilled, (state, action) => {
                state.createEntryState = "succeeded";
                if (action.payload?.data) {
                    if (state.allEntry?.data) {
                    state.allEntry.data.push(action.payload.data);
                    state.allEntry.pagination.total += 1;
                    } else {
                        state.allEntry = {
                            success: true,
                            message: "Estate field entries created successfully",
                            data: [action.payload.data],
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
            .addCase(createEntry.rejected, (state, action) => {
                state.createEntryState = "failed";
                state.error = action.error.message || "Failed to create estate field entries";
            });


        // 🔹 UPDATE ESTATE ADDRESS FIELD
        builder
            .addCase(updateEntry.pending, (state) => {
                state.updateEntryState = "isLoading";
            })
            .addCase(updateEntry.fulfilled, (state, action) => {
                state.updateEntryState = "succeeded";
                const updated = action.payload?.data;
                if (updated && state.allEntry?.data) {
                    state.allEntry.data = state.allEntry.data.map((entry) =>
                    entry.id === updated.id ? updated : entry
                    );
                }
            })
            .addCase(updateEntry.rejected, (state, action) => {
                state.updateEntryState = "failed";
                state.error = action.error.message || "Failed to update estate field entry";
            });

        
        // 🔹 DELETE ESTATE ADDRESS FIELD
        builder
            .addCase(deleteEntry.pending, (state) => {
                state.deleteEntryState = "isLoading";
            })
            .addCase(deleteEntry.fulfilled, (state, action) => {
                state.deleteEntryState = "succeeded";
            const deletedId = action.meta.arg; 
            if (state.allEntry?.data) {
                state.allEntry.data = state.allEntry.data.filter(
                (entry) => entry.id !== deletedId
                );
                state.allEntry.pagination.total -= 1;
            }
            })
            .addCase(deleteEntry.rejected, (state, action) => {
                state.deleteEntryState = "failed";
                state.error = action.error.message || "Failed to delete estate";
            });


        // ✅ GET ENTRY STATS (Dynamic by fieldId)
        builder
            .addCase(getEntryStats.pending, (state) => {
                state.getEntryStatsState = "isLoading";
            })
            .addCase(getEntryStats.fulfilled, (state, action) => {
                state.getEntryStatsState = "succeeded";
                const fieldId =
                typeof action.meta.arg === "string"
                    ? action.meta.arg
                    : "";
                if (fieldId) {
                state.stats[fieldId] = action.payload?.data || {};
                }
            })
            .addCase(getEntryStats.rejected, (state, action) => {
                state.getEntryStatsState = "failed";
                state.error =
                action.error.message || "Failed to fetch entry stats";
            });
    },
});


export const { resetEntryState } = entrySlice.actions;
export default entrySlice.reducer;