import { createSlice } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/lib/api-error";
import {
    activateUser,
    suspendUser,
    deleteUser,
    getAllUsersByEstate,
    getAllUsersByCompany,
    getUser,
    updateUser,
} from './super-admin-user';


export interface SuperAdminUserDetails {
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
  serviceCharge?: boolean;
  invitationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
  _id?: string;
  addressId?: string;
  addressIds?: { id: string; data: Record<string, string> }[];
  residentType?: string;
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

export interface AllSuperAdminUserDetailsResponse {
  success: boolean;
  message: string;
  data: SuperAdminUserDetails[];
  pagination: Pagination;
}



export interface UserState {
    activateUserState: "idle" | "isLoading" | "succeeded" | "failed";
    suspendUserState: "idle" | "isLoading" | "succeeded" | "failed";
    deleteUserState: "idle" | "isLoading" | "succeeded" | "failed";
    getAllUsersByEstateState: "idle" | "isLoading" | "succeeded" | "failed";
    getAllUsersByCompanyState: "idle" | "isLoading" | "succeeded" | "failed";
    getUserState: "idle" | "isLoading" | "succeeded" | "failed";
    updateUserState: "idle" | "isLoading" | "succeeded" | "failed";
    status: "idle" | "isLoading" | "succeeded" | "failed";
    user: SuperAdminUserDetails | null;
    allSuperAdminUsers: AllSuperAdminUserDetailsResponse | null;
    error: string | null;
}


const initialState: UserState = {
    activateUserState: "idle",
    suspendUserState: "idle",
    deleteUserState: "idle",
    getAllUsersByEstateState: "idle",
    getAllUsersByCompanyState: "idle",
    getUserState: "idle",
    updateUserState: "idle",
    status: "idle",
    user: null,
    allSuperAdminUsers: null,
    error: null, 
}



const superAdminUserSlice = createSlice({
    name: 'superAdminUser',
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

                const pagination = action.payload?.pagination;
                const requestedPage = Number(action.meta.arg?.page) || 1;
                const requestedLimit = Number(action.meta.arg?.limit) || 10;
                const pageSize =
                  Number(pagination?.pageSize ?? pagination?.limit ?? requestedLimit) ||
                  requestedLimit;
                const total =
                  Number(pagination?.total ?? action.payload?.data?.length ?? 0) || 0;
                state.allSuperAdminUsers = {
                    success: action.payload?.success ?? true,
                    message: action.payload?.message ?? "Estates users retrieved successfully",
                    data: action.payload?.data || [],
                    pagination: {
                        total,
                        currentPage:
                          Number(pagination?.currentPage ?? pagination?.page ?? requestedPage) ||
                          requestedPage,
                        totalPages:
                          Number(pagination?.totalPages ?? pagination?.pages) ||
                          Math.max(1, Math.ceil(total / pageSize)),
                        pageSize,
                    },
                };
            })
            .addCase(getAllUsersByEstate.rejected, (state, action) => {
                state.getAllUsersByEstateState = "failed";
                state.status = "failed";
                state.error = getApiErrorMessage(action.payload) ?? null;
            });

        builder
            .addCase(getAllUsersByCompany.pending, (state) => {
                state.getAllUsersByCompanyState = "isLoading";
                state.status = "isLoading";
            })
            .addCase(getAllUsersByCompany.fulfilled, (state, action) => {
                state.getAllUsersByCompanyState = "succeeded";
                state.status = "succeeded";

                const pagination = action.payload?.pagination;
                const requestedPage = Number(action.meta.arg?.page) || 1;
                const requestedLimit = Number(action.meta.arg?.limit) || 10;
                const pageSize =
                  Number(pagination?.pageSize ?? pagination?.limit ?? requestedLimit) ||
                  requestedLimit;
                const total =
                  Number(pagination?.total ?? action.payload?.data?.length ?? 0) || 0;
                state.allSuperAdminUsers = {
                    success: action.payload?.success ?? true,
                    message: action.payload?.message ?? "Company users retrieved successfully",
                    data: action.payload?.data || [],
                    pagination: {
                        total,
                        currentPage:
                          Number(pagination?.currentPage ?? pagination?.page ?? requestedPage) ||
                          requestedPage,
                        totalPages:
                          Number(pagination?.totalPages ?? pagination?.pages) ||
                          Math.max(1, Math.ceil(total / pageSize)),
                        pageSize,
                    },
                };
            })
            .addCase(getAllUsersByCompany.rejected, (state, action) => {
                state.getAllUsersByCompanyState = "failed";
                state.status = "failed";
                state.error = getApiErrorMessage(action.payload) ?? null;
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
            state.error = getApiErrorMessage(action.payload) ?? null;
            });


        builder
            .addCase(activateUser.pending, (state) => {
            state.activateUserState = "isLoading";
            })
            .addCase(activateUser.fulfilled, (state, action) => {
            state.activateUserState = "succeeded";
            const updated = action.payload?.data;
            if (updated && state.allSuperAdminUsers?.data) {
                state.allSuperAdminUsers.data = state.allSuperAdminUsers.data.map((est) =>
                est.id === updated.id ? updated : est
                );
            }
            })
            .addCase(activateUser.rejected, (state, action) => {
            state.activateUserState = "failed";
            state.error = getApiErrorMessage(action.payload) ?? null;
            });


        builder
            .addCase(suspendUser.pending, (state) => {
            state.suspendUserState = "isLoading";
            })
            .addCase(suspendUser.fulfilled, (state, action) => {
            state.suspendUserState = "succeeded";
            const updated = action.payload?.data;
            if (updated && state.allSuperAdminUsers?.data) {
                state.allSuperAdminUsers.data = state.allSuperAdminUsers.data.map((est) =>
                est.id === updated.id ? updated : est
                );
            }
            })
            .addCase(suspendUser.rejected, (state, action) => {
            state.suspendUserState = "failed";
            state.error = getApiErrorMessage(action.payload) ?? null;
            });
        

        builder
            .addCase(deleteUser.pending, (state) => {
            state.deleteUserState = "isLoading";
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
            state.deleteUserState = "succeeded";
            const deletedId = action.meta.arg; 
            if (state.allSuperAdminUsers?.data) {
                state.allSuperAdminUsers.data = state.allSuperAdminUsers.data.filter(
                (est) => est.id !== deletedId
                );
                state.allSuperAdminUsers.pagination.total -= 1;
            }
            })
            .addCase(deleteUser.rejected, (state, action) => {
            state.deleteUserState = "failed";
            state.error = getApiErrorMessage(action.payload) ?? null;
            });

        builder
            .addCase(updateUser.pending, (state) => {
              state.updateUserState = "isLoading";
              state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
              state.updateUserState = "succeeded";
              const updated = action.payload?.data;
              if (updated) {
                if (state.user && (state.user.id === updated.id || state.user._id === updated.id)) {
                  state.user = { ...state.user, ...updated };
                }
                if (state.allSuperAdminUsers?.data) {
                  state.allSuperAdminUsers.data = state.allSuperAdminUsers.data.map(
                    (u) => (u.id === updated.id || u._id === updated.id ? { ...u, ...updated } : u),
                  );
                }
              }
            })
            .addCase(updateUser.rejected, (state, action) => {
              state.updateUserState = "failed";
              state.error = getApiErrorMessage(action.payload) ?? null;
            });
        
    },
});


export const { resetUserState } = superAdminUserSlice.actions;
export default superAdminUserSlice.reducer;