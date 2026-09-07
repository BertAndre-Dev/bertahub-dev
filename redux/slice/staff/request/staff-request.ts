import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  enrichRequestItemsWithActorNames,
  resolveCreatedByFromRaw,
  type RequestActor,
} from "@/lib/request-actor";
import {
  parseRequestFieldValues,
  parseRequestSteps,
  resolveCurrentStepName,
  type RequestRecordField,
  type RequestWorkflowStep,
} from "@/lib/request-record";
import axiosInstance from "@/utils/axiosInstance";

export const STAFF_REQUEST_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type StaffRequestStatus = (typeof STAFF_REQUEST_STATUSES)[number];

export const STAFF_REQUEST_STATUS_OPTIONS: {
  value: StaffRequestStatus | "";
  label: string;
}[] = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export interface StaffRequestItem {
  id: string;
  _id?: string;
  code?: string;
  title: string;
  description?: string;
  category?: string;
  estateId?: string;
  attachments?: string[];
  workflowId?: string;
  status?: StaffRequestStatus;
  currentStepOrder?: number;
  currentStepName?: string;
  steps?: RequestWorkflowStep[];
  fieldValues?: RequestRecordField[];
  createdBy?: string | RequestActor;
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestFieldValue {
  key: string;
  value: string;
}

export interface CreateStaffRequestPayload {
  title: string;
  description?: string;
  category: string;
  estateId: string;
  /** Hosted https:// URLs from POST /api/v1/uploads. Never send base64 here. */
  attachments?: string[];
  workflowId?: string;
  /** For file/image workflow fields, `value` is a base64 data URI (or a hosted URL). */
  fieldValues?: RequestFieldValue[];
}

export interface ListStaffRequestsParams {
  estateId: string;
  status?: StaffRequestStatus | "";
  search?: string;
  page?: number;
  limit?: number;
}

export type StaffRequestDecision = "approve" | "reject";

export interface DecideStaffRequestPayload {
  id: string;
  decision: StaffRequestDecision;
  comment?: string;
  estateId?: string;
}

export interface CancelStaffRequestPayload {
  id: string;
  estateId?: string;
}

function normalizeStatus(raw: unknown): StaffRequestStatus {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  return (STAFF_REQUEST_STATUSES as readonly string[]).includes(value)
    ? (value as StaffRequestStatus)
    : "pending_approval";
}

export interface StaffRequestsListResponse {
  success?: boolean;
  data?:
    | StaffRequestItem[]
    | {
        items?: StaffRequestItem[];
        pagination?: {
          total: number;
          page: number;
          limit: number;
          pages?: number;
        };
      };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  };
  message?: string;
}

function extractList(payload: StaffRequestsListResponse | undefined): StaffRequestItem[] {
  const dataBlock = payload?.data;
  if (Array.isArray(dataBlock)) return dataBlock;
  if (dataBlock && Array.isArray(dataBlock.items)) return dataBlock.items;
  return [];
}

function extractPagination(payload: StaffRequestsListResponse | undefined) {
  const nested =
    payload?.data && !Array.isArray(payload.data)
      ? payload.data.pagination
      : undefined;
  return (
    nested ??
    payload?.pagination ?? {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1,
    }
  );
}

export function normalizeStaffRequest(
  raw: Record<string, unknown>,
): StaffRequestItem {
  const id = String(raw._id ?? raw.id ?? "");
  const steps = parseRequestSteps(raw.steps);
  const currentStepOrder =
    raw.currentStepOrder != null ? Number(raw.currentStepOrder) : undefined;

  return {
    id,
    _id: id,
    code: raw.code != null ? String(raw.code).trim() || undefined : undefined,
    title: String(raw.title ?? ""),
    description: raw.description as string | undefined,
    category: raw.category as string | undefined,
    estateId: raw.estateId as string | undefined,
    attachments: Array.isArray(raw.attachments)
      ? (raw.attachments as string[])
      : undefined,
    workflowId: raw.workflowId as string | undefined,
    status: normalizeStatus(raw.status),
    currentStepOrder,
    currentStepName: resolveCurrentStepName({
      currentStepName:
        raw.currentStepName != null ? String(raw.currentStepName) : undefined,
      currentStepOrder,
      steps,
    }),
    steps,
    fieldValues: parseRequestFieldValues(raw.fieldValues),
    createdBy: resolveCreatedByFromRaw(raw),
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  };
}

export interface StaffRequestCategory {
  value: string;
  label: string;
}

export interface StaffRequestCategoriesResponse {
  success?: boolean;
  message?: string;
  data?: StaffRequestCategory[];
}

function normalizeCategoryOption(raw: unknown): StaffRequestCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const value = String(item.value ?? item.id ?? item._id ?? "").trim();
  if (!value) return null;
  const label = String(item.label ?? item.name ?? value).trim() || value;
  return { value, label };
}

/** GET /api/v1/requests/categories — list available request categories */
export const getStaffRequestCategories = createAsyncThunk(
  "staffRequest/getCategories",
  async (_void: void, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<StaffRequestCategoriesResponse>(
        "/api/v1/requests/categories",
      );
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      return raw
        .map(normalizeCategoryOption)
        .filter((item): item is StaffRequestCategory => Boolean(item));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch request categories",
      });
    }
  },
);

/** POST /api/v1/requests — create a request and submit it for approval */
export const createStaffRequest = createAsyncThunk(
  "staffRequest/create",
  async (payload: CreateStaffRequestPayload, { rejectWithValue }) => {
    const title = payload.title?.trim();
    const category = payload.category?.trim();
    const estateId = payload.estateId?.trim();

    if (!title) {
      return rejectWithValue({ message: "Title is required." });
    }
    if (!category) {
      return rejectWithValue({ message: "Category is required." });
    }
    if (!estateId) {
      return rejectWithValue({ message: "Estate is required." });
    }

    try {
      const body: Record<string, unknown> = {
        title,
        category,
        estateId,
        description: payload.description?.trim() || undefined,
        attachments:
          payload.attachments && payload.attachments.length > 0
            ? payload.attachments
            : undefined,
      };
      const workflowId = payload.workflowId?.trim();
      if (workflowId) body.workflowId = workflowId;
      const fieldValues = (payload.fieldValues ?? [])
        .map((field) => {
          const key = field.key?.trim() ?? "";
          const raw =
            typeof field.value === "string" ? field.value : "";
          const value = raw.startsWith("data:") ? raw : raw.trim();
          return { key, value };
        })
        .filter((field) => field.key && field.value);
      if (fieldValues.length > 0) body.fieldValues = fieldValues;

      const res = await axiosInstance.post("/api/v1/requests", body);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to create request",
      });
    }
  },
);

/** GET /api/v1/requests — list estate requests */
export const getStaffRequests = createAsyncThunk(
  "staffRequest/getList",
  async (params: ListStaffRequestsParams, { rejectWithValue }) => {
    try {
      const { estateId, status, search, page = 1, limit = 10 } = params;
      if (!estateId?.trim()) {
        return rejectWithValue({ message: "Estate is required." });
      }

      const query: Record<string, string | number> = {
        estateId: estateId.trim(),
        page,
        limit,
      };
      if (status?.trim()) query.status = status.trim();
      if (search?.trim()) query.search = search.trim();

      const res = await axiosInstance.get<StaffRequestsListResponse>(
        "/api/v1/requests",
        { params: query },
      );

      const list = await enrichRequestItemsWithActorNames(
        extractList(res.data).map((item) =>
          normalizeStaffRequest(item as unknown as Record<string, unknown>),
        ),
      );
      const pagination = extractPagination(res.data);

      return { list, pagination };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch requests",
      });
    }
  },
);

function extractRequestPayload(data: unknown): StaffRequestItem | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const nested = root.data;

  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return normalizeStaffRequest(nested as Record<string, unknown>);
  }
  if (Array.isArray(nested) && nested[0] && typeof nested[0] === "object") {
    return normalizeStaffRequest(nested[0] as Record<string, unknown>);
  }
  if (root.id != null || root._id != null || root.title != null) {
    return normalizeStaffRequest(root);
  }
  return null;
}

/** GET /api/v1/requests/{id}?estateId= — get a request by ID */
export const getStaffRequestById = createAsyncThunk(
  "staffRequest/getById",
  async (
    payload: { id: string; estateId?: string },
    { rejectWithValue },
  ) => {
    const requestId = payload.id?.trim();
    if (!requestId) {
      return rejectWithValue({ message: "Request id is required." });
    }

    try {
      const estateId = payload.estateId?.trim();
      const res = await axiosInstance.get(`/api/v1/requests/${requestId}`, {
        params: estateId ? { estateId } : undefined,
      });
      const item = extractRequestPayload(res.data);
      if (!item) {
        return rejectWithValue({ message: "Request not found." });
      }
      const [enriched] = await enrichRequestItemsWithActorNames([item]);
      return enriched ?? item;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch request details",
      });
    }
  },
);

/** POST /api/v1/requests/{id}/decide — approve or reject the current step */
export const decideStaffRequest = createAsyncThunk(
  "staffRequest/decide",
  async (payload: DecideStaffRequestPayload, { rejectWithValue }) => {
    const id = payload.id?.trim();
    const decision = payload.decision;
    const comment = payload.comment?.trim() ?? "";

    if (!id) {
      return rejectWithValue({ message: "Request id is required." });
    }
    if (decision !== "approve" && decision !== "reject") {
      return rejectWithValue({ message: "Decision must be approve or reject." });
    }
    if (decision === "reject" && comment.length < 3) {
      return rejectWithValue({
        message: "A rejection reason of at least 3 characters is required.",
      });
    }

    try {
      const body: Record<string, string> = { decision };
      if (comment) body.comment = comment;
      const estateId = payload.estateId?.trim();

      const res = await axiosInstance.post(
        `/api/v1/requests/${id}/decide`,
        body,
        { params: estateId ? { estateId } : undefined },
      );
      return {
        id,
        decision,
        data: res.data,
        item: extractRequestPayload(res.data),
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to submit decision",
      });
    }
  },
);

/** POST /api/v1/requests/{id}/cancel — cancel a request */
export const cancelStaffRequest = createAsyncThunk(
  "staffRequest/cancel",
  async (payload: CancelStaffRequestPayload, { rejectWithValue }) => {
    const requestId = payload.id?.trim();
    const estateId = payload.estateId?.trim();
    if (!requestId) {
      return rejectWithValue({ message: "Request id is required." });
    }

    try {
      const res = await axiosInstance.post(
        `/api/v1/requests/${requestId}/cancel`,
        {},
        { params: estateId ? { estateId } : undefined },
      );
      return {
        id: requestId,
        data: res.data,
        item: extractRequestPayload(res.data),
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to cancel request",
      });
    }
  },
);

