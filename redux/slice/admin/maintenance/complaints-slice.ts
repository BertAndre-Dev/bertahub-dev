import { createSlice } from "@reduxjs/toolkit";
import {
  getComplaintsDashboard,
  getComplaintsByEstate,
  getComplaintById,
  updateComplaintStatus,
  getCommentsByComplaint,
  createComment,
} from "./complaints";

export interface ComplaintResident {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ComplaintAddress {
  id?: string;
  data?: Record<string, string>;
}

export interface ComplaintItem {
  id: string;
  title?: string;
  description: string;
  category?: string;
  status: string;
  priority?: string;
  residentId?: string | ComplaintResident;
  estateId?: string;
  resident?: ComplaintResident;
  addressId?: ComplaintAddress | string;
  ticketNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentItem {
  id: string;
  complaintId: string;
  userId: string;
  text: string;
  user?: { firstName?: string; lastName?: string };
  createdAt?: string;
}

export interface ComplaintsResponse {
  success: boolean;
  message: string;
  data: ComplaintItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  };
}

export interface CommentsResponse {
  success?: boolean;
  data?: CommentItem[];
  pagination?: { total: number; page: number; limit: number; pages?: number };
}

export type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface ComplaintsDashboardData {
  summary?: { totalComplaints?: number };
  statusBreakdown?: Record<string, number>;
  categoryBreakdown?: Array<{ category: string; count: number }>;
  pendingComplaints?: Array<{
    _id: string;
    title?: string;
    description?: string;
    category?: string;
    status?: string;
    createdAt?: string;
    daysOpen?: number;
    [key: string]: unknown;
  }>;
  oldestUnresolvedComplaints?: Array<{ _id: string; title?: string; category?: string; status?: string; createdAt?: string; daysOpen?: number }>;
  resolutionRate?: { totalComplaints?: number; resolvedComplaints?: number; pendingComplaints?: number; resolutionRate?: number };
  [key: string]: unknown;
}

export interface ComplaintsState {
  getComplaintsDashboardStatus: AsyncStatus;
  getComplaintsByEstateStatus: AsyncStatus;
  getComplaintByIdStatus: AsyncStatus;
  updateComplaintStatusStatus: AsyncStatus;
  getCommentsByComplaintStatus: AsyncStatus;
  createCommentStatus: AsyncStatus;
  complaints: ComplaintsResponse | null;
  complaintsDashboard: ComplaintsDashboardData | null;
  currentComplaint: ComplaintItem | null;
  commentsByComplaintId: Record<string, CommentItem[]>;
  error: string | null;
}

const initialState: ComplaintsState = {
  getComplaintsDashboardStatus: "idle",
  getComplaintsByEstateStatus: "idle",
  getComplaintByIdStatus: "idle",
  updateComplaintStatusStatus: "idle",
  getCommentsByComplaintStatus: "idle",
  createCommentStatus: "idle",
  complaints: null,
  complaintsDashboard: null,
  currentComplaint: null,
  commentsByComplaintId: {},
  error: null,
};

const complaintsSlice = createSlice({
  name: "complaints",
  initialState,
  reducers: {
    resetComplaintsState: (state) => {
      state.error = null;
      state.getComplaintsByEstateStatus = "idle";
      state.updateComplaintStatusStatus = "idle";
      state.createCommentStatus = "idle";
    },
    clearCommentsForComplaint: (state, action: { payload: string }) => {
      delete state.commentsByComplaintId[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getComplaintsDashboard.pending, (state) => {
        state.getComplaintsDashboardStatus = "isLoading";
        state.error = null;
      })
      .addCase(getComplaintsDashboard.fulfilled, (state, action) => {
        state.getComplaintsDashboardStatus = "succeeded";
        state.error = null;
        const raw = action.payload?.data;
        state.complaintsDashboard = raw ?? null;
        const pending = raw?.pendingComplaints ?? [];
        const normalized: ComplaintItem[] = pending.map((p: { _id: string; title?: string; description?: string; category?: string; status?: string; createdAt?: string; [key: string]: unknown }) => ({
          id: String(p._id ?? (p as any).id ?? ""),
          title: p.title,
          description: p.description ?? "",
          category: p.category,
          status: p.status ?? "pending",
          createdAt: p.createdAt,
        }));
        state.complaints = {
          success: true,
          message: "",
          data: normalized,
          pagination: { total: normalized.length, page: 1, limit: normalized.length || 10, pages: 1 },
        };
      })
      .addCase(getComplaintsDashboard.rejected, (state, action) => {
        state.getComplaintsDashboardStatus = "failed";
        state.complaintsDashboard = null;
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch complaints dashboard";
      })

      .addCase(getComplaintsByEstate.pending, (state) => {
        state.getComplaintsByEstateStatus = "isLoading";
        state.error = null;
      })
      .addCase(getComplaintsByEstate.fulfilled, (state, action) => {
        state.getComplaintsByEstateStatus = "succeeded";
        state.complaints = {
          success: action.payload?.success ?? true,
          message: action.payload?.message ?? "",
          data: action.payload?.data ?? [],
          pagination: action.payload?.pagination ?? {
            total: 0,
            page: 1,
            limit: 10,
            pages: 1,
          },
        };
      })
      .addCase(getComplaintsByEstate.rejected, (state, action) => {
        state.getComplaintsByEstateStatus = "failed";
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

      .addCase(updateComplaintStatus.pending, (state) => {
        state.updateComplaintStatusStatus = "isLoading";
      })
      .addCase(updateComplaintStatus.fulfilled, (state, action) => {
        state.updateComplaintStatusStatus = "succeeded";
        const updated = action.payload?.data;
        if (updated?.id && state.complaints?.data) {
          state.complaints.data = state.complaints.data.map((c) =>
            c.id === updated.id ? { ...c, ...updated } : c
          );
        }
      })
      .addCase(updateComplaintStatus.rejected, (state, action) => {
        state.updateComplaintStatusStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to update status";
      })

      .addCase(getCommentsByComplaint.pending, (state) => {
        state.getCommentsByComplaintStatus = "isLoading";
      })
      .addCase(getCommentsByComplaint.fulfilled, (state, action) => {
        state.getCommentsByComplaintStatus = "succeeded";
        const complaintId = action.meta.arg.complaintId;
        const list = action.payload?.data ?? [];
        state.commentsByComplaintId[complaintId] = list;
      })
      .addCase(getCommentsByComplaint.rejected, (state) => {
        state.getCommentsByComplaintStatus = "failed";
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

export const { resetComplaintsState, clearCommentsForComplaint } =
  complaintsSlice.actions;
export default complaintsSlice.reducer;
