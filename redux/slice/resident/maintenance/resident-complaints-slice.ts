import { createSlice } from "@reduxjs/toolkit";
import type { ResidentComplaintItem, ResidentCommentItem } from "./resident-complaints";
import {
  createComplaint,
  getComplaintsByAddress,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  getCommentsByComplaint,
  createComment,
} from "./resident-complaints";

export type { ResidentComplaintItem, ResidentCommentItem };

export type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

interface ResidentComplaintsState {
  createComplaintStatus: AsyncStatus;
  getComplaintsByAddressStatus: AsyncStatus;
  getComplaintByIdStatus: AsyncStatus;
  updateComplaintStatus: AsyncStatus;
  deleteComplaintStatus: AsyncStatus;
  getCommentsByComplaintStatus: AsyncStatus;
  createCommentStatus: AsyncStatus;
  list: ResidentComplaintItem[];
  listByAddress: Record<string, ResidentComplaintItem[]>;
  pagination: { total: number; page: number; limit: number; pages?: number } | null;
  currentComplaint: ResidentComplaintItem | null;
  commentsByComplaintId: Record<string, ResidentCommentItem[]>;
  error: string | null;
}

const initialState: ResidentComplaintsState = {
  createComplaintStatus: "idle",
  getComplaintsByAddressStatus: "idle",
  getComplaintByIdStatus: "idle",
  updateComplaintStatus: "idle",
  deleteComplaintStatus: "idle",
  getCommentsByComplaintStatus: "idle",
  createCommentStatus: "idle",
  list: [],
  listByAddress: {},
  pagination: null,
  currentComplaint: null,
  commentsByComplaintId: {},
  error: null,
};

function normalizeComplaint(p: Record<string, unknown>): ResidentComplaintItem {
  const id = String(p._id ?? p.id ?? "");
  return {
    id,
    _id: id,
    title: p.title as string,
    description: (p.description as string) ?? "",
    category: p.category as string,
    status: (p.status as string) ?? "pending",
    priority: p.priority as string,
    residentId: p.residentId as string,
    resident: p.resident as ResidentComplaintItem["resident"],
    addressId: p.addressId as ResidentComplaintItem["addressId"],
    estateId: p.estateId as string,
    ticketNumber: p.ticketNumber as string,
    createdAt: p.createdAt as string,
    updatedAt: p.updatedAt as string,
    image: p.image as string,
  };
}

function normalizeComment(c: Record<string, unknown>): ResidentCommentItem {
  const id = String(c._id ?? c.id ?? "");
  return {
    id,
    _id: id,
    complaintId: String(c.complaintId ?? ""),
    userId: String(c.userId ?? ""),
    text: (c.text as string) ?? "",
    user: c.user as ResidentCommentItem["user"],
    createdAt: c.createdAt as string,
  };
}

const residentComplaintsSlice = createSlice({
  name: "residentComplaints",
  initialState,
  reducers: {
    clearResidentComplaintsError: (state) => {
      state.error = null;
    },
    clearResidentComplaintsList: (state) => {
      state.list = [];
      state.listByAddress = {};
      state.pagination = null;
    },
    clearCommentsForComplaint: (state, action: { payload: string }) => {
      delete state.commentsByComplaintId[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createComplaint.pending, (state) => {
        state.createComplaintStatus = "isLoading";
        state.error = null;
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.createComplaintStatus = "succeeded";
        state.error = null;
        const d = action.payload?.data ?? action.payload;
        if (d) {
          const item = normalizeComplaint(d as Record<string, unknown>);
          state.list = [item, ...state.list];
        }
      })
      .addCase(createComplaint.rejected, (state, action) => {
        state.createComplaintStatus = "failed";
        state.error = (action.payload as string) ?? "Failed to create complaint";
      })

      .addCase(getComplaintsByAddress.pending, (state) => {
        state.getComplaintsByAddressStatus = "isLoading";
        state.error = null;
      })
      .addCase(getComplaintsByAddress.fulfilled, (state, action) => {
        state.getComplaintsByAddressStatus = "succeeded";
        state.error = null;
        const addressId = action.meta.arg.addressId;
        const raw = action.payload?.data ?? action.payload?.items ?? action.payload ?? [];
        const list = Array.isArray(raw) ? raw.map((p: Record<string, unknown>) => normalizeComplaint(p)) : [];
        state.listByAddress[addressId] = list;
        state.list = list;
        state.pagination =
          action.payload?.pagination ?? action.payload?.data?.pagination ?? {
            total: list.length,
            page: 1,
            limit: action.meta.arg.limit ?? 20,
            pages: 1,
          };
      })
      .addCase(getComplaintsByAddress.rejected, (state, action) => {
        state.getComplaintsByAddressStatus = "failed";
        state.error = (action.payload as string) ?? "Failed to fetch complaints";
      })

      .addCase(getComplaintById.pending, (state) => {
        state.getComplaintByIdStatus = "isLoading";
      })
      .addCase(getComplaintById.fulfilled, (state, action) => {
        state.getComplaintByIdStatus = "succeeded";
        const d = action.payload?.data ?? action.payload;
        state.currentComplaint = d ? normalizeComplaint(d as Record<string, unknown>) : null;
      })
      .addCase(getComplaintById.rejected, (state, action) => {
        state.getComplaintByIdStatus = "failed";
        state.error = (action.payload as string) ?? "Failed to fetch complaint";
      })

      .addCase(updateComplaint.fulfilled, (state, action) => {
        state.updateComplaintStatus = "succeeded";
        const updated = action.payload?.data ?? action.payload;
        if (updated?.id ?? updated?._id) {
          const id = String(updated.id ?? updated._id ?? "");
          state.list = state.list.map((c) =>
            c.id === id ? { ...c, ...normalizeComplaint(updated as Record<string, unknown>) } : c
          );
          if (state.currentComplaint?.id === id) {
            state.currentComplaint = { ...state.currentComplaint, ...normalizeComplaint(updated as Record<string, unknown>) };
          }
        }
      })
      .addCase(updateComplaint.rejected, (state, action) => {
        state.updateComplaintStatus = "failed";
        state.error = (action.payload as string) ?? "Failed to update complaint";
      })

      .addCase(deleteComplaint.fulfilled, (state, action) => {
        state.deleteComplaintStatus = "succeeded";
        const id = action.meta.arg;
        state.list = state.list.filter((c) => c.id !== id && String(c.id) !== id);
        if (state.currentComplaint?.id === id) state.currentComplaint = null;
      })
      .addCase(deleteComplaint.rejected, (state, action) => {
        state.deleteComplaintStatus = "failed";
        state.error = (action.payload as string) ?? "Failed to delete complaint";
      })

      .addCase(getCommentsByComplaint.pending, (state) => {
        state.getCommentsByComplaintStatus = "isLoading";
      })
      .addCase(getCommentsByComplaint.fulfilled, (state, action) => {
        state.getCommentsByComplaintStatus = "succeeded";
        const complaintId = action.meta.arg.complaintId;
        const raw = action.payload?.data ?? action.payload ?? [];
        const list = Array.isArray(raw) ? raw : [];
        state.commentsByComplaintId[complaintId] = list.map((c: Record<string, unknown>) =>
          normalizeComment(c)
        );
      })
      .addCase(getCommentsByComplaint.rejected, (state) => {
        state.getCommentsByComplaintStatus = "failed";
      })

      .addCase(createComment.fulfilled, (state, action) => {
        state.createCommentStatus = "succeeded";
        const newComment = action.payload?.data ?? action.payload;
        const complaintId = action.meta.arg.complaintId;
        if (newComment && complaintId) {
          const list = state.commentsByComplaintId[complaintId] ?? [];
          state.commentsByComplaintId[complaintId] = [
            ...list,
            normalizeComment(newComment as Record<string, unknown>),
          ];
        }
      })
      .addCase(createComment.rejected, (state, action) => {
        state.createCommentStatus = "failed";
        state.error = (action.payload as string) ?? "Failed to add comment";
      });
  },
});

export const {
  clearResidentComplaintsError,
  clearResidentComplaintsList,
  clearCommentsForComplaint,
} = residentComplaintsSlice.actions;
export default residentComplaintsSlice.reducer;
