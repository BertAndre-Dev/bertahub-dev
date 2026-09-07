import { createSlice } from "@reduxjs/toolkit";
import {
    activateUser,
    suspendUser,
    deleteUser,
    getAllUsersByEstate,
    getUser,
    updateUser,
} from './user';


export interface AdminUserAddressRef {
  id: string;
  data: Record<string, string>;
}

export interface AdminUserDetails {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address: string;
  role: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  invitationStatus?: string;
  updatedAt?: string;
  id?: string;
  _id?: string;
  addressId?: string;
  addressIds?: AdminUserAddressRef[];
  residentType?: string;
  serviceCharge?: boolean;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
  suspensionReason?: string | null;
}


export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface AllAdminUserDetailsResponse {
  success: boolean;
  message: string;
  data: AdminUserDetails[];
  pagination: Pagination;
}



export interface UserState {
    activateUserState: "idle" | "isLoading" | "succeeded" | "failed";
    suspendUserState: "idle" | "isLoading" | "succeeded" | "failed";
    deleteUserState: "idle" | "isLoading" | "succeeded" | "failed";
    getAllUsersByEstateState: "idle" | "isLoading" | "succeeded" | "failed";
    getUserState: "idle" | "isLoading" | "succeeded" | "failed";
    updateUserState: "idle" | "isLoading" | "succeeded" | "failed";
    status: "idle" | "isLoading" | "succeeded" | "failed";
    user: AdminUserDetails | null;
    allAdminUsers: AllAdminUserDetailsResponse | null;
    error: string | null;
}


const initialState: UserState = {
    activateUserState: "idle",
    suspendUserState: "idle",
    deleteUserState: "idle",
    getAllUsersByEstateState: "idle",
    getUserState: "idle",
    updateUserState: "idle",
    status: "idle",
    user: null,
    allAdminUsers: null,
    error: null, 
}



const adminUserSlice = createSlice({
    name: 'adminUser',
    initialState,
    reducers: {
        resetUserState: (state) => {
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers(builder) {
        builder
            .addCase(getAllUsersByEstate.pending, (state) => {
                state.getAllUsersByEstateState = "isLoading";
                state.status = "isLoading";
            })
            .addCase(getAllUsersByEstate.fulfilled, (state, action) => {
                state.getAllUsersByEstateState = "succeeded";
                state.status = "succeeded";
                // ✅ Now store both data and pagination
                state.allAdminUsers = {
                    success: action.payload?.success ?? true,
                    message: action.payload?.message ?? "Estates users retrieved successfully",
                    data: action.payload?.data || [],
                    pagination: action.payload?.pagination || {
                    total: 0,
                    currentPage: 1,
                    totalPages: 1,
                    pageSize: 10,
                    },
                };
            })
            .addCase(getAllUsersByEstate.rejected, (state, action) => {
                state.getAllUsersByEstateState = "failed";
                state.status = "failed";
                state.error = action.error.message || "Failed to fetch estates user";
            });
        
        builder
            .addCase(getUser.pending, (state) => {
            state.getUserState = "isLoading";
            })
            .addCase(getUser.fulfilled, (state, action) => {
            state.getUserState = "succeeded";
            state.user = action.payload?.data || null;
            })
            .addCase(getUser.rejected, (state, action) => {
            state.getUserState = "failed";
            state.error = action.error.message || "Failed to fetch estate user";
            });


        builder
            .addCase(activateUser.pending, (state) => {
            state.activateUserState = "isLoading";
            })
            .addCase(activateUser.fulfilled, (state, action) => {
            state.activateUserState = "succeeded";
            const updated = action.payload?.data;
            if (updated && state.allAdminUsers?.data) {
                state.allAdminUsers.data = state.allAdminUsers.data.map((est) =>
                est.id === updated.id ? updated : est
                );
            }
            })
            .addCase(activateUser.rejected, (state, action) => {
            state.activateUserState = "failed";
            state.error = action.error.message || "Failed to activate estate";
            });


        builder
            .addCase(suspendUser.pending, (state) => {
            state.suspendUserState = "isLoading";
            })
            .addCase(suspendUser.fulfilled, (state, action) => {
            state.suspendUserState = "succeeded";
            const updated = action.payload?.data;
            if (updated && state.allAdminUsers?.data) {
                state.allAdminUsers.data = state.allAdminUsers.data.map((est) =>
                est.id === updated.id ? updated : est
                );
            }
            })
            .addCase(suspendUser.rejected, (state, action) => {
            state.suspendUserState = "failed";
            state.error = action.error.message || "Failed to suspend estate";
            });
        

        builder
            .addCase(deleteUser.pending, (state) => {
            state.deleteUserState = "isLoading";
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
            state.deleteUserState = "succeeded";
            const deletedId = action.meta.arg; 
            if (state.allAdminUsers?.data) {
                state.allAdminUsers.data = state.allAdminUsers.data.filter(
                (est) => est.id !== deletedId
                );
                state.allAdminUsers.pagination.total -= 1;
            }
            })
            .addCase(deleteUser.rejected, (state, action) => {
            state.deleteUserState = "failed";
            state.error = action.error.message || "Failed to delete estate";
            });

        builder
            .addCase(updateUser.pending, (state) => {
            state.updateUserState = "isLoading";
            state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
            state.updateUserState = "succeeded";
            const updated = action.payload?.data as AdminUserDetails | undefined;
            if (updated) {
                const updatedId = updated.id || updated._id;
                if (state.user && (state.user.id === updatedId || state.user._id === updatedId)) {
                    state.user = { ...state.user, ...updated };
                }
                if (updatedId && state.allAdminUsers?.data) {
                    state.allAdminUsers.data = state.allAdminUsers.data.map((u) =>
                        (u.id === updatedId || u._id === updatedId) ? { ...u, ...updated } : u,
                    );
                }
            }
            })
            .addCase(updateUser.rejected, (state, action) => {
            state.updateUserState = "failed";
            state.error = action.error.message || "Failed to update user";
            });
        
    },
});


export const { resetUserState } = adminUserSlice.actions;
export default adminUserSlice.reducer;