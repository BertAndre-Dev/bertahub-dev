import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  StaffComplaintComment,
  StaffComplaintItem,
  StaffComplaintStats,
} from "./staff-maintenance";
import {
  assignComplaintToStaff,
  createStaffComplaintComment,
  fetchStaffMaintenancePage,
  fetchStaffMaintenanceStats,
  getStaffAssignedComplaints,
  getStaffComplaintById,
  getStaffComplaintComments,
  normalizeStaffComment,
  normalizeStaffComplaint,
  updateStaffComplaintStatus,
} from "./staff-maintenance";

export type { StaffComplaintItem, StaffComplaintComment, StaffComplaintStats };

export type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface StaffMaintenanceUiState {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: string;
  categoryFilter: string;
  selectedComplaintId: string | null;
  hasInitialized: boolean;
}

interface StaffMaintenanceState {
  getComplaintsByStaffStatus: AsyncStatus;
  getComplaintByIdStatus: AsyncStatus;
  updateComplaintStatusStatus: AsyncStatus;
  assignComplaintStatus: AsyncStatus;
  getCommentsStatus: AsyncStatus;
  createCommentStatus: AsyncStatus;
  statsStatus: AsyncStatus;
  assignedComplaints: {
    data: StaffComplaintItem[];
    pagination?: { total: number; page: number; limit: number; pages?: number };
  } | null;
  currentComplaint: StaffComplaintItem | null;
  commentsByComplaintId: Record<string, StaffComplaintComment[]>;
  stats: StaffComplaintStats;
  ui: StaffMaintenanceUiState;
  error: string | null;
}

const initialStats: StaffComplaintStats = {
  assigned: 0,
  inProgress: 0,
  completed: 0,
  overdue: 0,
};

const initialState: StaffMaintenanceState = {
  getComplaintsByStaffStatus: "idle",
  getComplaintByIdStatus: "idle",
  updateComplaintStatusStatus: "idle",
  assignComplaintStatus: "idle",
  getCommentsStatus: "idle",
  createCommentStatus: "idle",
  statsStatus: "idle",
  assignedComplaints: null,
  currentComplaint: null,
  commentsByComplaintId: {},
  stats: initialStats,
  ui: {
    page: 1,
    pageSize: 10,
    search: "",
    statusFilter: "",
    categoryFilter: "",
    selectedComplaintId: null,
    hasInitialized: false,
  },
  error: null,
};

function extractPagination(payload: Record<string, unknown> | undefined) {
  const pagination =
    (payload?.pagination as
      | { total: number; page: number; limit: number; pages?: number }
      | undefined) ??
    (payload?.data as { pagination?: { total: number; page: number; limit: number; pages?: number } })
      ?.pagination;

  return pagination ?? { total: 0, page: 1, limit: 10, pages: 1 };
}

function extractList(payload: Record<string, unknown> | undefined) {
  const dataBlock = payload?.data as unknown[] | { items?: unknown[] } | undefined;
  const raw = Array.isArray(dataBlock)
    ? dataBlock
    : Array.isArray((dataBlock as { items?: unknown[] })?.items)
      ? (dataBlock as { items: unknown[] }).items
      : [];
  return Array.isArray(raw) ? raw : [];
}

function upsertComplaintInList(
  list: StaffComplaintItem[],
  updated: StaffComplaintItem,
): StaffComplaintItem[] {
  return list.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
}

const staffMaintenanceSlice = createSlice({
  name: "staffMaintenance",
  initialState,
  reducers: {
    clearStaffMaintenanceError: (state) => {
      state.error = null;
    },
    resetStaffMaintenanceState: () => initialState,
    setStaffMaintenanceSearch: (state, action: PayloadAction<string>) => {
      state.ui.search = action.payload;
      state.ui.page = 1;
    },
    setStaffMaintenanceStatusFilter: (state, action: PayloadAction<string>) => {
      state.ui.statusFilter = action.payload;
      state.ui.page = 1;
    },
    setStaffMaintenanceCategoryFilter: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.ui.categoryFilter = action.payload;
      state.ui.page = 1;
    },
    setStaffMaintenancePage: (state, action: PayloadAction<number>) => {
      state.ui.page = action.payload;
    },
    setStaffMaintenanceSelectedComplaintId: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.ui.selectedComplaintId = action.payload;
    },
    clearStaffMaintenanceSelectedComplaint: (state) => {
      state.ui.selectedComplaintId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStaffAssignedComplaints.pending, (state) => {
        state.getComplaintsByStaffStatus = "isLoading";
        state.error = null;
      })
      .addCase(getStaffAssignedComplaints.fulfilled, (state, action) => {
        state.getComplaintsByStaffStatus = "succeeded";
        state.ui.hasInitialized = true;
        const pl = action.payload as Record<string, unknown> | undefined;
        const list = extractList(pl).map((p) =>
          normalizeStaffComplaint(p as Record<string, unknown>),
        );
        state.assignedComplaints = {
          data: list,
          pagination: extractPagination(pl),
        };
        const summary = pl?.summary as StaffComplaintStats | undefined;
        if (summary && typeof summary.assigned === "number") {
          state.stats = summary;
        }
      })
      .addCase(fetchStaffMaintenancePage.pending, (state) => {
        state.getComplaintsByStaffStatus = "isLoading";
        state.error = null;
      })
      .addCase(fetchStaffMaintenancePage.fulfilled, (state) => {
        state.getComplaintsByStaffStatus = "succeeded";
      })
      .addCase(fetchStaffMaintenancePage.rejected, (state, action) => {
        state.getComplaintsByStaffStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          "Failed to load maintenance requests";
      })
      .addCase(getStaffAssignedComplaints.rejected, (state, action) => {
        state.getComplaintsByStaffStatus = "failed";
        state.assignedComplaints = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          "Failed to fetch assigned complaints";
      })

      .addCase(fetchStaffMaintenanceStats.pending, (state) => {
        state.statsStatus = "isLoading";
      })
      .addCase(fetchStaffMaintenanceStats.fulfilled, (state, action) => {
        state.statsStatus = "succeeded";
        state.stats = action.payload ?? initialStats;
      })
      .addCase(fetchStaffMaintenanceStats.rejected, (state) => {
        state.statsStatus = "failed";
      })

      .addCase(getStaffComplaintById.pending, (state) => {
        state.getComplaintByIdStatus = "isLoading";
      })
      .addCase(getStaffComplaintById.fulfilled, (state, action) => {
        state.getComplaintByIdStatus = "succeeded";
        const d = (action.payload as { data?: unknown })?.data ?? action.payload;
        const complaint = d
          ? normalizeStaffComplaint(d as Record<string, unknown>)
          : null;
        state.currentComplaint = complaint;
        if (complaint?.id && complaint.comments?.length) {
          state.commentsByComplaintId[complaint.id] = complaint.comments;
        }
      })
      .addCase(getStaffComplaintById.rejected, (state, action) => {
        state.getComplaintByIdStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          "Failed to fetch complaint";
      })

      .addCase(updateStaffComplaintStatus.pending, (state) => {
        state.updateComplaintStatusStatus = "isLoading";
      })
      .addCase(updateStaffComplaintStatus.fulfilled, (state, action) => {
        state.updateComplaintStatusStatus = "succeeded";
        const updatedRaw =
          (action.payload as { data?: unknown })?.data ?? action.payload;
        if (!updatedRaw) return;
        const updated = normalizeStaffComplaint(
          updatedRaw as Record<string, unknown>,
        );
        if (state.assignedComplaints?.data) {
          state.assignedComplaints.data = upsertComplaintInList(
            state.assignedComplaints.data,
            updated,
          );
        }
        if (state.currentComplaint?.id === updated.id) {
          state.currentComplaint = updated;
        }
      })
      .addCase(updateStaffComplaintStatus.rejected, (state, action) => {
        state.updateComplaintStatusStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          "Failed to update status";
      })

      .addCase(assignComplaintToStaff.pending, (state) => {
        state.assignComplaintStatus = "isLoading";
      })
      .addCase(assignComplaintToStaff.fulfilled, (state, action) => {
        state.assignComplaintStatus = "succeeded";
        const updatedRaw =
          (action.payload as { data?: unknown })?.data ?? action.payload;
        if (!updatedRaw) return;
        const updated = normalizeStaffComplaint(
          updatedRaw as Record<string, unknown>,
        );
        if (state.assignedComplaints?.data) {
          state.assignedComplaints.data = upsertComplaintInList(
            state.assignedComplaints.data,
            updated,
          );
        }
      })
      .addCase(assignComplaintToStaff.rejected, (state, action) => {
        state.assignComplaintStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          "Failed to assign complaint";
      })

      .addCase(getStaffComplaintComments.pending, (state) => {
        state.getCommentsStatus = "isLoading";
      })
      .addCase(getStaffComplaintComments.fulfilled, (state, action) => {
        state.getCommentsStatus = "succeeded";
        const complaintId = action.meta.arg.complaintId;
        const raw =
          (action.payload as { data?: unknown })?.data ?? action.payload ?? [];
        const list = Array.isArray(raw) ? raw : [];
        state.commentsByComplaintId[complaintId] = list.map((c) =>
          normalizeStaffComment(c as Record<string, unknown>),
        );
      })
      .addCase(getStaffComplaintComments.rejected, (state) => {
        state.getCommentsStatus = "failed";
      })

      .addCase(createStaffComplaintComment.pending, (state) => {
        state.createCommentStatus = "isLoading";
      })
      .addCase(createStaffComplaintComment.fulfilled, (state, action) => {
        state.createCommentStatus = "succeeded";
        const complaintId = action.meta.arg.complaintId;
        const complaintRaw =
          (action.payload as { data?: unknown })?.data ?? action.payload;
        if (!complaintRaw || !complaintId) return;
        const complaint = normalizeStaffComplaint(
          complaintRaw as Record<string, unknown>,
        );
        if (state.currentComplaint?.id === complaint.id) {
          state.currentComplaint = complaint;
        }
        if (complaint.comments?.length) {
          state.commentsByComplaintId[complaintId] = complaint.comments;
        }
      })
      .addCase(createStaffComplaintComment.rejected, (state, action) => {
        state.createCommentStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          "Failed to add comment";
      });
  },
});

export const {
  clearStaffMaintenanceError,
  resetStaffMaintenanceState,
  setStaffMaintenanceSearch,
  setStaffMaintenanceStatusFilter,
  setStaffMaintenanceCategoryFilter,
  setStaffMaintenancePage,
  setStaffMaintenanceSelectedComplaintId,
  clearStaffMaintenanceSelectedComplaint,
} = staffMaintenanceSlice.actions;
export default staffMaintenanceSlice.reducer;
