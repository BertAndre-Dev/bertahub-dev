import { createAsyncThunk } from "@reduxjs/toolkit";

import axiosInstance from "@/utils/axiosInstance";
import type {
  ChatGroup,
  ChatGroupsListResponse,
  CreateChatGroupPayload,
  UpdateChatGroupPayload,
} from "@/types/community-group";

type RejectValue = { message: string };

type ApiResponse<T> = { success: boolean; data: T; message?: string };

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function isValidObjectId(id: string): boolean {
  return OBJECT_ID_RE.test(id);
}

function invalidIdMessage(label: string): RejectValue {
  return { message: `Invalid ${label}.` };
}

type ApiPagination = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  totalPages?: number;
};

type ApiChatGroup = {
  id?: string;
  _id?: string;
  name?: string;
  description?: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
  memberCount?: number;
  membersCount?: number;
  unreadCount?: number;
  lastMessage?: string;
  lastMessagePreview?: string;
};

function normalizePagination(p: ApiPagination | undefined): {
  total: number;
  page: number;
  limit: number;
  pages: number;
} {
  const total =
    typeof p?.total === "number" ? p.total : Number(p?.total ?? 0) || 0;
  const page = typeof p?.page === "number" ? p.page : Number(p?.page ?? 1) || 1;
  const limit =
    typeof p?.limit === "number" ? p.limit : Number(p?.limit ?? 20) || 20;
  const pagesRaw = p?.pages ?? p?.totalPages ?? 0;
  const pages =
    typeof pagesRaw === "number" ? pagesRaw : Number(pagesRaw ?? 0) || 0;
  return { total, page, limit, pages };
}

function normalizeGroup(raw: ApiChatGroup): ChatGroup {
  const _id = (raw._id ?? raw.id ?? "").toString();
  const memberRaw = raw.memberCount ?? raw.membersCount;
  return {
    _id,
    name: (raw.name ?? "").toString() || "Untitled group",
    description: raw.description,
    profileImage: raw.profileImage,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    memberCount:
      typeof memberRaw === "number" ? memberRaw : Number(memberRaw ?? 0) || 0,
    unreadCount:
      typeof raw.unreadCount === "number"
        ? raw.unreadCount
        : Number(raw.unreadCount ?? 0) || 0,
    lastMessagePreview: raw.lastMessagePreview ?? raw.lastMessage,
  };
}

// POST /api/v1/chat/groups/create
export const createChatGroup = createAsyncThunk<
  ApiResponse<ChatGroup>,
  CreateChatGroupPayload,
  { rejectValue: RejectValue }
>("communityGroup/createChatGroup", async (payload, { rejectWithValue }) => {
  try {
    if (!payload.name?.trim()) {
      return rejectWithValue({ message: "Group name is required." });
    }
    const res = await axiosInstance.post("/api/v1/chat/groups/create", {
      name: payload.name.trim(),
      description: payload.description?.trim() || undefined,
      profileImage: payload.profileImage?.trim() || undefined,
    });
    const raw = res.data as ApiResponse<ApiChatGroup>;
    return {
      ...raw,
      data: normalizeGroup(raw.data),
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to create group.",
    });
  }
});

// GET /api/v1/chat/groups?page=&limit=&search=
export const getChatGroups = createAsyncThunk<
  ChatGroupsListResponse,
  { page?: number; limit?: number; search?: string },
  { rejectValue: RejectValue }
>("communityGroup/getChatGroups", async (params, { rejectWithValue }) => {
  try {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const search = params.search?.trim() || undefined;
    const res = await axiosInstance.get("/api/v1/chat/groups", {
      params: { page, limit, search },
    });
    const body = res.data as {
      success?: boolean;
      data?: ApiChatGroup[];
      pagination?: ApiPagination;
    };
    const list = Array.isArray(body.data) ? body.data : [];
    return {
      success: body.success ?? true,
      data: list.map(normalizeGroup),
      pagination: body.pagination
        ? normalizePagination(body.pagination)
        : undefined,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to load groups.",
    });
  }
});

// GET /api/v1/chat/groups/{groupId}
export const getChatGroupById = createAsyncThunk<
  ApiResponse<ChatGroup>,
  { groupId: string },
  { rejectValue: RejectValue }
>("communityGroup/getChatGroupById", async ({ groupId }, { rejectWithValue }) => {
  try {
    const id = groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const res = await axiosInstance.get(`/api/v1/chat/groups/${id}`);
    const raw = res.data as ApiResponse<ApiChatGroup>;
    return { ...raw, data: normalizeGroup(raw.data) };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to load group.",
    });
  }
});

// PUT /api/v1/chat/groups/{groupId}
export const updateChatGroup = createAsyncThunk<
  ApiResponse<ChatGroup>,
  UpdateChatGroupPayload,
  { rejectValue: RejectValue }
>("communityGroup/updateChatGroup", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const body: Record<string, string> = {};
    if (payload.name?.trim()) body.name = payload.name.trim();
    if (payload.description !== undefined) {
      body.description = payload.description.trim();
    }
    if (payload.profileImage?.trim()) {
      body.profileImage = payload.profileImage.trim();
    }
    const res = await axiosInstance.put(`/api/v1/chat/groups/${id}`, body);
    const raw = res.data as ApiResponse<ApiChatGroup>;
    return { ...raw, data: normalizeGroup(raw.data) };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to update group.",
    });
  }
});

// DELETE /api/v1/chat/groups/{groupId}
export const deleteChatGroup = createAsyncThunk<
  ApiResponse<unknown>,
  { groupId: string },
  { rejectValue: RejectValue }
>("communityGroup/deleteChatGroup", async ({ groupId }, { rejectWithValue }) => {
  try {
    const id = groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const res = await axiosInstance.delete(`/api/v1/chat/groups/${id}`);
    return (res.data ?? { success: true }) as ApiResponse<unknown>;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to delete group.",
    });
  }
});
