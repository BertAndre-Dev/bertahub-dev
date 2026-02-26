import { createSlice } from "@reduxjs/toolkit";
import {
  getComplaintsByAddresses,
  getComplaintById,
  createComplaint,
  getCommentsByComplaint,
  createComment,
} from "./resident-complaints";

export interface ResidentComplaintResident {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ResidentComplaintAddress {
  id?: string;
  data?: Record<string, string>;
}

export interface ResidentComplaintItem {
  id: string;
  title?: string;
  description: string;
  category?: string;
  status: string;
  priority?: string;
  residentId?: string;
  estateId?: string;
  resident?: ResidentComplaintResident;
  addressId?: ResidentComplaintAddress | string;
  ticketNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResidentCommentItem {
  id: string;
  complaintId: string;
  userId: string;
  text: string;
  user?: { firstName?: string; lastName?: string };
  createdAt?: string;
}

export interface ResidentComplaintsResponse {
  success: boolean;
  message: string;
  data: ResidentComplaintItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  };
}

export type ResidentComplaintStatus =
  | "idle"
  | "isLoading"
  | "succeeded"
  | "failed";

export interface ResidentComplaintsState {
  getComplaintsStatus: ResidentComplaintStatus;
  getComplaintByIdStatus: ResidentComplaintStatus;
  createComplaintStatus: ResidentComplaintStatus;
  getCommentsStatus: ResidentComplaintStatus;
  createCommentStatus: ResidentComplaintStatus;
  complaints: ResidentComplaintsResponse | null;
  currentComplaint: ResidentComplaintItem | null;
  commentsByComplaintId: Record<string, ResidentCommentItem[]>;
  error: string | null;
}

const initialState: ResidentComplaintsState = {
  getComplaintsStatus: "idle",
  getComplaintByIdStatus: "idle",
  createComplaintStatus: "idle",
  getCommentsStatus: "idle",
  createCommentStatus: "idle",
  complaints: null,
  currentComplaint: null,
  commentsByComplaintId: {},
  error: null,
};

const residentComplaintsSlice = createSlice({
  name: "residentComplaints",
  initialState,
  reducers: {
    resetResidentComplaintsState: (state) => {
      state.error = null;
      state.createComplaintStatus = "idle";
      state.createCommentStatus = "idle";
    },
    clearCommentsForComplaint: (state, action: { payload: string }) => {
      delete state.commentsByComplaintId[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getComplaintsByAddresses.pending, (state) => {
        state.getComplaintsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getComplaintsByAddresses.fulfilled, (state, action) => {
        state.getComplaintsStatus = "succeeded";
        state.complaints = {
          success: action.payload?.success ?? true,
          message: action.payload?.message ?? "",
          data: action.payload?.data ?? [],
          pagination: action.payload?.pagination ?? {
            total: 0,
            page: 1,
            limit: 20,
            pages: 1,
          },
        };
      })
      .addCase(getComplaintsByAddresses.rejected, (state, action) => {
        state.getComplaintsStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch complaints";
      })

      .addCase(getComplaintById.pending, (state) => {
        state.getComplaintByIdStatus = "isLoading";
      })
      .addCase(getComplaintById.fulfilled, (state, action) => {
        state.getComplaintByIdStatus = "succeeded";
        state.currentComplaint = action.payload?.data ?? null;
      })
      .addCase(getComplaintById.rejected, (state, action) => {
        state.getComplaintByIdStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch complaint";
      })

      .addCase(createComplaint.pending, (state) => {
        state.createComplaintStatus = "isLoading";
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.createComplaintStatus = "succeeded";
        const newItem = action.payload?.data;
        if (newItem && state.complaints?.data) {
          state.complaints.data = [newItem, ...state.complaints.data];
        }
      })
      .addCase(createComplaint.rejected, (state, action) => {
        state.createComplaintStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to create complaint";
      })

      .addCase(getCommentsByComplaint.pending, (state) => {
        state.getCommentsStatus = "isLoading";
      })
      .addCase(getCommentsByComplaint.fulfilled, (state, action) => {
        state.getCommentsStatus = "succeeded";
        const complaintId = action.meta.arg.complaintId;
        const list = action.payload?.data ?? [];
        state.commentsByComplaintId[complaintId] = list;
      })
      .addCase(getCommentsByComplaint.rejected, (state) => {
        state.getCommentsStatus = "failed";
      })

      .addCase(createComment.pending, (state) => {
        state.createCommentStatus = "isLoading";
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.createCommentStatus = "succeeded";
        const newComment = action.payload?.data;
        const complaintId = action.meta.arg.complaintId;
        if (newComment && complaintId) {
          const list = state.commentsByComplaintId[complaintId] ?? [];
          state.commentsByComplaintId[complaintId] = [...list, newComment];
        }
      })
      .addCase(createComment.rejected, (state, action) => {
        state.createCommentStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to add comment";
      });
  },
});

export const {
  resetResidentComplaintsState,
  clearCommentsForComplaint,
} = residentComplaintsSlice.actions;
export default residentComplaintsSlice.reducer;
