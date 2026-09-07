import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  activateCompanyUser,
  deleteCompanyUser,
  getCompanyUser,
  getCompanyUsersByCompany,
  getCompanyUsersByEstate,
  suspendCompanyUser,
  updateCompanyUser,
} from "./company-user";

export interface CompanyUserDetails {
  firstName: string;
  lastName: string;
  email: string;
  countryCode?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  role: string;
  image?: string;
  isActive?: boolean;
  serviceCharge?: boolean;
  invitationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
  _id?: string;
  residentType?: string;
  designationId?: string;
  memberships?: Array<{
    designationId?: string | null;
    isCurrent?: boolean;
  }>;
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

export interface AllCompanyUsersResponse {
  success: boolean;
  message: string;
  data: CompanyUserDetails[];
  pagination: Pagination;
}

export interface CompanyUserState {
  activateUserStatus: "idle" | "isLoading" | "succeeded" | "failed";
  suspendUserStatus: "idle" | "isLoading" | "succeeded" | "failed";
  deleteUserStatus: "idle" | "isLoading" | "succeeded" | "failed";
  getUsersStatus: "idle" | "isLoading" | "succeeded" | "failed";
  getUserStatus: "idle" | "isLoading" | "succeeded" | "failed";
  updateUserStatus: "idle" | "isLoading" | "succeeded" | "failed";
  user: CompanyUserDetails | null;
  allUsers: AllCompanyUsersResponse | null;
  error: string | null;
}

const initialState: CompanyUserState = {
  activateUserStatus: "idle",
  suspendUserStatus: "idle",
  deleteUserStatus: "idle",
  getUsersStatus: "idle",
  getUserStatus: "idle",
  updateUserStatus: "idle",
  user: null,
  allUsers: null,
  error: null,
};

function userId(u: CompanyUserDetails) {
  return u.id || u._id || "";
}

const companyUserSlice = createSlice({
  name: "companyUser",
  initialState,
  reducers: {
    clearCompanyUserError: (state) => {
      state.error = null;
    },
    resetCompanyUserState: (state) => {
      state.getUsersStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handleUsersPending = (state: CompanyUserState) => {
      state.getUsersStatus = "isLoading";
      state.error = null;
    };
    const handleUsersFulfilled = (
      state: CompanyUserState,
      action: { payload?: { success?: boolean; message?: string; data?: CompanyUserDetails[]; pagination?: Partial<Pagination> } },
    ) => {
      state.getUsersStatus = "succeeded";
      const pagination = action.payload?.pagination;
      state.allUsers = {
        success: action.payload?.success ?? true,
        message: action.payload?.message ?? "Users retrieved successfully",
        data: action.payload?.data ?? [],
        pagination: {
          total: pagination?.total ?? action.payload?.data?.length ?? 0,
          currentPage: Number(pagination?.currentPage) || 1,
          totalPages: Number(pagination?.totalPages) || 1,
          pageSize: Number(pagination?.pageSize) || 10,
        },
      };
    };
    const handleUsersRejected = (
      state: CompanyUserState,
      action: { payload?: unknown; error: { message?: string } },
    ) => {
      state.getUsersStatus = "failed";
      state.error = getApiErrorMessage(action.payload) ?? null;
    };

    builder
      .addCase(getCompanyUsersByEstate.pending, handleUsersPending)
      .addCase(getCompanyUsersByEstate.fulfilled, handleUsersFulfilled)
      .addCase(getCompanyUsersByEstate.rejected, handleUsersRejected)
      .addCase(getCompanyUsersByCompany.pending, handleUsersPending)
      .addCase(getCompanyUsersByCompany.fulfilled, handleUsersFulfilled)
      .addCase(getCompanyUsersByCompany.rejected, handleUsersRejected);

    builder
      .addCase(getCompanyUser.pending, (state) => {
        state.getUserStatus = "isLoading";
      })
      .addCase(getCompanyUser.fulfilled, (state, action) => {
        state.getUserStatus = "succeeded";
        state.user = action.payload?.data ?? null;
      })
      .addCase(getCompanyUser.rejected, (state, action) => {
        state.getUserStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });

    builder
      .addCase(activateCompanyUser.pending, (state) => {
        state.activateUserStatus = "isLoading";
      })
      .addCase(activateCompanyUser.fulfilled, (state, action) => {
        state.activateUserStatus = "succeeded";
        const updated = action.payload?.data as CompanyUserDetails | undefined;
        if (updated?.id && state.allUsers?.data) {
          const id = userId(updated);
          state.allUsers.data = state.allUsers.data.map((u) =>
            userId(u) === id ? { ...u, ...updated, isActive: true } : u,
          );
        }
      })
      .addCase(activateCompanyUser.rejected, (state, action) => {
        state.activateUserStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });

    builder
      .addCase(suspendCompanyUser.pending, (state) => {
        state.suspendUserStatus = "isLoading";
      })
      .addCase(suspendCompanyUser.fulfilled, (state, action) => {
        state.suspendUserStatus = "succeeded";
        const updated = action.payload?.data as CompanyUserDetails | undefined;
        if (updated && state.allUsers?.data) {
          const id = userId(updated);
          state.allUsers.data = state.allUsers.data.map((u) =>
            userId(u) === id ? { ...u, ...updated, isActive: false } : u,
          );
        }
      })
      .addCase(suspendCompanyUser.rejected, (state, action) => {
        state.suspendUserStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });

    builder
      .addCase(deleteCompanyUser.pending, (state) => {
        state.deleteUserStatus = "isLoading";
      })
      .addCase(deleteCompanyUser.fulfilled, (state, action) => {
        state.deleteUserStatus = "succeeded";
        const deletedId = (action.payload as { deletedId?: string })?.deletedId;
        if (deletedId && state.allUsers?.data) {
          state.allUsers.data = state.allUsers.data.filter(
            (u) => userId(u) !== deletedId,
          );
          state.allUsers.pagination.total = Math.max(
            0,
            state.allUsers.pagination.total - 1,
          );
        }
      })
      .addCase(deleteCompanyUser.rejected, (state, action) => {
        state.deleteUserStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });

    builder
      .addCase(updateCompanyUser.pending, (state) => {
        state.updateUserStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateCompanyUser.fulfilled, (state, action) => {
        state.updateUserStatus = "succeeded";
        const updated = action.payload?.data as CompanyUserDetails | undefined;
        if (updated) {
          const id = userId(updated);
          if (state.user && userId(state.user) === id) {
            state.user = { ...state.user, ...updated };
          }
          if (id && state.allUsers?.data) {
            state.allUsers.data = state.allUsers.data.map((u) =>
              userId(u) === id ? { ...u, ...updated } : u,
            );
          }
        }
      })
      .addCase(updateCompanyUser.rejected, (state, action) => {
        state.updateUserStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearCompanyUserError, resetCompanyUserState } =
  companyUserSlice.actions;
export default companyUserSlice.reducer;

/** Persisted slice is typed as PersistPartial; cast inside selector. */
export const selectCompanyUserState = (state: RootState): CompanyUserState =>
  (state.companyUser as CompanyUserState | undefined) ?? initialState;

export const selectCompanyUsersList = (state: RootState) =>
  selectCompanyUserState(state).allUsers?.data ?? [];

export const selectCompanyUsersPagination = (state: RootState) =>
  selectCompanyUserState(state).allUsers?.pagination ?? null;

export const selectCompanyUsersLoading = (state: RootState) =>
  selectCompanyUserState(state).getUsersStatus === "isLoading";
