import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface StaffComplaintResident {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  image?: string;
}

export interface StaffComplaintAddress {
  id?: string;
  _id?: string;
  data?: Record<string, string>;
}

export interface StaffComplaintItem {
  id: string;
  _id?: string;
  title?: string;
  description: string;
  category?: string;
  status: string;
  priority?: string;
  residentId?: string | StaffComplaintResident;
  resident?: StaffComplaintResident;
  addressId?: StaffComplaintAddress | string;
  estateId?: string;
  assignedTo?: string;
  ticketNumber?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffComplaintComment {
  id: string;
  _id?: string;
  complaintId: string;
  userId: string;
  text: string;
  user?: { firstName?: string; lastName?: string };
  createdAt?: string;
  image?: string;
}

export interface StaffComplaintStats {
  assigned: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

type AssignedListParams = {
  page?: number;
  limit?: number;
  status?: string;
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

/** GET /api/v1/complaints/staff/assigned — complaints assigned to the signed-in staff member */
export const getStaffAssignedComplaints = createAsyncThunk(
  "staffMaintenance/getStaffAssignedComplaints",
  async (
    { page = 1, limit = 10, status }: AssignedListParams,
    { rejectWithValue },
  ) => {
    try {
      const params: Record<string, string | number> = { page, limit };
      if (status?.trim()) params.status = status.trim();

      const res = await axiosInstance.get(
        "/api/v1/complaints/staff/assigned",
        { params },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch assigned complaints",
      });
    }
  },
);

/** @deprecated Use getStaffAssignedComplaints */
export const getComplaintsByStaff = getStaffAssignedComplaints;

/** GET /api/v1/complaints/:id */
export const getStaffComplaintById = createAsyncThunk(
  "staffMaintenance/getStaffComplaintById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/complaints/${id}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch complaint",
      });
    }
  },
);

/** PUT /api/v1/complaints/:id/update-status */
export const updateStaffComplaintStatus = createAsyncThunk(
  "staffMaintenance/updateStaffComplaintStatus",
  async (
    { id, status, notes }: { id: string; status: string; notes?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/complaints/${id}/update-status`,
        { status, notes },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update status",
      });
    }
  },
);

/** POST /api/v1/complaints/:id/assign */
export const assignComplaintToStaff = createAsyncThunk(
  "staffMaintenance/assignComplaintToStaff",
  async (
    { id, staffId }: { id: string; staffId: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post(`/api/v1/complaints/${id}/assign`, {
        staffId,
      });
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to assign complaint to staff",
      });
    }
  },
);

/** GET /api/v1/comments/complaint/:complaintId */
export const getStaffComplaintComments = createAsyncThunk(
  "staffMaintenance/getStaffComplaintComments",
  async (
    {
      complaintId,
      page = 1,
      limit = 50,
    }: { complaintId: string; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/comments/complaint/${complaintId}`,
        { params: { page, limit } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch comments",
      });
    }
  },
);

/** POST /api/v1/comments */
export const createStaffComplaintComment = createAsyncThunk(
  "staffMaintenance/createStaffComplaintComment",
  async (
    {
      complaintId,
      userId,
      text,
      image,
    }: {
      complaintId: string;
      userId: string;
      text: string;
      image?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post("/api/v1/comments", {
        complaintId,
        userId,
        text,
        ...(image ? { image } : {}),
      });
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to add comment",
      });
    }
  },
);

export function normalizeStaffComplaint(
  p: Record<string, unknown>,
): StaffComplaintItem {
  const id = String(p._id ?? p.id ?? "");
  return {
    id,
    _id: id,
    title: p.title as string,
    description: (p.description as string) ?? "",
    category: p.category as string,
    status: (p.status as string) ?? "pending",
    priority: p.priority as string,
    residentId: p.residentId as StaffComplaintItem["residentId"],
    resident: p.resident as StaffComplaintItem["resident"],
    addressId: p.addressId as StaffComplaintItem["addressId"],
    estateId: p.estateId as string,
    assignedTo: p.assignedTo as string,
    ticketNumber: p.ticketNumber as string,
    image: p.image as string,
    createdAt: p.createdAt as string,
    updatedAt: p.updatedAt as string,
  };
}

export function normalizeStaffComment(
  c: Record<string, unknown>,
): StaffComplaintComment {
  const id = String(c._id ?? c.id ?? "");
  return {
    id,
    _id: id,
    complaintId: String(c.complaintId ?? ""),
    userId: String(c.userId ?? ""),
    text: (c.text as string) ?? "",
    user: c.user as StaffComplaintComment["user"],
    createdAt: c.createdAt as string,
    image: c.image as string,
  };
}

export function normalizeStatus(status?: string) {
  return (status ?? "").trim().toLowerCase();
}

export function isComplaintOverdue(item: StaffComplaintItem) {
  const status = normalizeStatus(item.status);
  if (status === "completed" || status === "blocked") return false;
  const ts = new Date(item.updatedAt || item.createdAt || 0).getTime();
  if (!ts) return false;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - ts > sevenDaysMs;
}

export async function fetchStaffComplaintStats(): Promise<StaffComplaintStats> {
  const res = await axiosInstance.get("/api/v1/complaints/staff/assigned", {
    params: { page: 1, limit: 500 },
  });
  const payload = res.data as Record<string, unknown>;
  const summary = payload.summary as StaffComplaintStats | undefined;
  if (summary && typeof summary.assigned === "number") {
    return summary;
  }

  const list = extractList(payload).map((p) =>
    normalizeStaffComplaint(p as Record<string, unknown>),
  );
  const pagination = extractPagination(payload);

  return {
    assigned: pagination.total || list.length,
    inProgress: list.filter((c) => normalizeStatus(c.status) === "in progress")
      .length,
    completed: list.filter((c) => normalizeStatus(c.status) === "completed")
      .length,
    overdue: list.filter((c) => isComplaintOverdue(c)).length,
  };
}

export const fetchStaffMaintenanceStats = createAsyncThunk(
  "staffMaintenance/fetchStaffMaintenanceStats",
  async (_void: void, { rejectWithValue }) => {
    try {
      return await fetchStaffComplaintStats();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch maintenance stats",
      });
    }
  },
);
