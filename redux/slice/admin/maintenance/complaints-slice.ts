import { createSlice } from "@reduxjs/toolkit";
import type { ComplaintItem, CommentItem } from "./complaints";
import {
  getComplaintsByEstate,
  getComplaintById,
  updateComplaintStatus,
  getCommentsByComplaint,
  createComment,
} from "./complaints";

export type { ComplaintItem, CommentItem };

export type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

interface ComplaintsState {
  getComplaintsByEstateStatus: AsyncStatus;
  getComplaintByIdStatus: AsyncStatus;
  updateComplaintStatusStatus: AsyncStatus;
  getCommentsByComplaintStatus: AsyncStatus;
  createCommentStatus: AsyncStatus;
  complaintsByEstate: {
    data: ComplaintItem[];
    pagination?: { total: number; page: number; limit: number; pages?: number };
  } | null;
  currentComplaint: ComplaintItem | null;
  commentsByComplaintId: Record<string, CommentItem[]>;
  error: string | null;
}

const initialState: ComplaintsState = {
  getComplaintsByEstateStatus: "idle",
  getComplaintByIdStatus: "idle",
  updateComplaintStatusStatus: "idle",
  getCommentsByComplaintStatus: "idle",
  createCommentStatus: "idle",
  complaintsByEstate: null,
  currentComplaint: null,
  commentsByComplaintId: {},
  error: null,
};

function normalizeComplaint(p: Record<string, unknown>): ComplaintItem {
  const id = String(p._id ?? p.id ?? "");
  return {
    id,
    _id: id,
    title: p.title as string,
    description: (p.description as string) ?? "",
    category: p.category as string,
    status: (p.status as string) ?? "pending",
    priority: p.priority as string,
    residentId: p.residentId as ComplaintItem["residentId"],
    resident: p.resident as ComplaintItem["resident"],
    addressId: p.addressId as ComplaintItem["addressId"],
    estateId: p.estateId as string,
    ticketNumber: p.ticketNumber as string,
    createdAt: p.createdAt as string,
    updatedAt: p.updatedAt as string,
    image: p.image as string,
  };
}

function normalizeComment(c: Record<string, unknown>): CommentItem {
  const id = String(c._id ?? c.id ?? "");
  return {
    id,
    _id: id,
    complaintId: String(c.complaintId ?? ""),
    userId: String(c.userId ?? ""),
    text: (c.text as string) ?? "",
    user: c.user as CommentItem["user"],
    createdAt: c.createdAt as string,
  };
}

const complaintsSlice = createSlice({
  name: "complaints",
  initialState,
  reducers: {
    clearComplaintsError: (state) => {
      state.error = null;
    },
    clearCommentsForComplaint: (state, action: { payload: string }) => {
      delete state.commentsByComplaintId[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getComplaintsByEstate.pending, (state) => {
        state.getComplaintsByEstateStatus = "isLoading";
        state.error = null;
      })
      .addCase(getComplaintsByEstate.fulfilled, (state, action) => {
        state.getComplaintsByEstateStatus = "succeeded";
        state.error = null;
        const pl = action.payload as Record<string, unknown> | undefined;
        const dataBlock = pl?.data as unknown[] | { items?: unknown[] } | undefined;
        const raw = Array.isArray(dataBlock)
          ? dataBlock
          : Array.isArray((dataBlock as { items?: unknown[] })?.items)
            ? (dataBlock as { items: unknown[] }).items
            : [];
        const list = Array.isArray(raw) ? raw : [];
        const pagination =
          (pl?.pagination as { total: number; page: number; limit: number; pages?: number } | undefined) ??
          (pl?.data as { pagination?: { total: number; page: number; limit: number; pages?: number } } | undefined)?.pagination ??
          { total: list.length, page: 1, limit: list.length || 10, pages: 1 };
        state.complaintsByEstate = {
          data: list.map((p) => normalizeComplaint(p as Record<string, unknown>)),
          pagination,
        };
      })
      .addCase(getComplaintsByEstate.rejected, (state, action) => {
        state.getComplaintsByEstateStatus = "failed";
        state.complaintsByEstate = null;
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

      .addCase(updateComplaintStatus.pending, (state) => {
        state.updateComplaintStatusStatus = "isLoading";
      })
      .addCase(updateComplaintStatus.fulfilled, (state, action) => {
        state.updateComplaintStatusStatus = "succeeded";
        const updated = action.payload?.data ?? action.payload;
        if (updated?.id && state.complaintsByEstate?.data) {
          const id = String(updated.id ?? updated._id ?? "");
          state.complaintsByEstate.data = state.complaintsByEstate.data.map(
            (c) => (c.id === id ? { ...c, ...normalizeComplaint(updated as Record<string, unknown>) } : c)
          );
        }
      })
      .addCase(updateComplaintStatus.rejected, (state, action) => {
        state.updateComplaintStatusStatus = "failed";
        state.error = (action.payload as string) ?? "Failed to update status";
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

      .addCase(createComment.pending, (state) => {
        state.createCommentStatus = "isLoading";
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

export const { clearComplaintsError, clearCommentsForComplaint } =
  complaintsSlice.actions;
export default complaintsSlice.reducer;
