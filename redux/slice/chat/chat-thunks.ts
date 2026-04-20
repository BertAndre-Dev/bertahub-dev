import { createAsyncThunk } from "@reduxjs/toolkit";

import axiosInstance from "@/utils/axiosInstance";
import type {
  AssignChatPayload,
  Chat,
  ChatHistoryResponse,
  ChatMessage,
  ChatsListResponse,
  ChatStatus,
  CreateChatPayload,
  SendMessagePayload,
  UpdateChatStatusPayload,
  UserRole,
} from "@/types/chat";

type RejectValue = { message: string };

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const DEFAULT_SUPPORT_AGENT_ID = "6973437206b085ec17baf78e";

function isValidObjectId(id: string): boolean {
  return OBJECT_ID_RE.test(id);
}

type ApiResponse<T> = { success: boolean; data: T; message?: string };

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

type ApiChatUser = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

type ApiChat = Omit<Chat, "_id" | "userId" | "supportAgentId"> & {
  id?: string;
  _id?: string;
  userId: string | ApiChatUser;
  supportAgentId?: string | ApiChatUser | null;
};

type ApiChatMessage = Omit<ChatMessage, "_id" | "senderId"> & {
  id?: string;
  _id?: string;
  senderId: string | ApiChatUser;
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

function normalizeRole(role: string | undefined): UserRole | undefined {
  const r = (role ?? "").toString().trim().toLowerCase();
  if (!r) return undefined;
  const normalized = r.replaceAll("_", "-").replaceAll(/\s+/g, "-");
  if (normalized === "super-admin" || normalized === "superadmin")
    return "super-admin";
  if (normalized === "admin") return "admin";
  if (normalized === "estate-admin" || normalized === "estateadmin")
    return "estate-admin";
  if (normalized === "resident") return "resident";
  if (normalized === "security") return "security";
  return undefined;
}

function normalizeUser(u: ApiChatUser): {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
} {
  const id = (u._id ?? u.id ?? "").toString();
  return {
    _id: id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: normalizeRole(u.role),
  };
}

function normalizeChat(c: ApiChat): Chat {
  const _id = (c._id ?? c.id ?? "").toString();
  const userId =
    typeof c.userId === "string" ? c.userId : normalizeUser(c.userId);
  let supportAgentId: Chat["supportAgentId"] | undefined;
  if (c.supportAgentId == null) {
    supportAgentId = undefined;
  } else if (typeof c.supportAgentId === "string") {
    supportAgentId = c.supportAgentId;
  } else {
    supportAgentId = normalizeUser(c.supportAgentId);
  }

  return {
    ...c,
    _id,
    userId,
    supportAgentId,
  };
}

function normalizeMessage(m: ApiChatMessage): ChatMessage {
  const _id = (m._id ?? m.id ?? "").toString();
  const senderId =
    typeof m.senderId === "string" ? m.senderId : normalizeUser(m.senderId);
  return {
    ...m,
    _id,
    senderId,
  };
}

// POST /api/v1/chat-mgt/create
export const createChat = createAsyncThunk<
  ApiResponse<Chat>,
  CreateChatPayload,
  { rejectValue: RejectValue }
>("chat/createChat", async (payload, { rejectWithValue }) => {
  try {
    const userId = payload.userId?.trim();
    if (!userId || !isValidObjectId(userId)) {
      return rejectWithValue(invalidIdMessage("userId"));
    }
    if (!isValidObjectId(DEFAULT_SUPPORT_AGENT_ID)) {
      return rejectWithValue(invalidIdMessage("supportAgentId"));
    }
    if (payload.estateId?.trim()) {
      const estateId = payload.estateId.trim();
      if (!isValidObjectId(estateId)) {
        return rejectWithValue(invalidIdMessage("estateId"));
      }
    }
    if (!payload.subject?.trim()) {
      return rejectWithValue({ message: "Subject is required." });
    }

    const res = await axiosInstance.post("/api/v1/chat-mgt/create", {
      ...payload,
      userId,
      supportAgentId: DEFAULT_SUPPORT_AGENT_ID,
      estateId: payload.estateId?.trim() || undefined,
      subject: payload.subject.trim(),
      description: payload.description?.trim() || undefined,
    });
    const raw = res.data as ApiResponse<ApiChat>;
    return { ...raw, data: normalizeChat(raw.data) };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to create chat.",
    });
  }
});

// POST /api/v1/chat-mgt/message/send
export const sendMessage = createAsyncThunk<
  ApiResponse<ChatMessage>,
  SendMessagePayload,
  { rejectValue: RejectValue }
>("chat/sendMessage", async (payload, { rejectWithValue }) => {
  try {
    const chatId = payload.chatId?.trim();
    if (!chatId || !isValidObjectId(chatId)) {
      return rejectWithValue(invalidIdMessage("chatId"));
    }
    if (!payload.content?.trim() && !payload.fileData?.trim()) {
      return rejectWithValue({ message: "Message content is required." });
    }
    if (payload.replyToMessageId?.trim()) {
      const replyId = payload.replyToMessageId.trim();
      if (!isValidObjectId(replyId)) {
        return rejectWithValue(invalidIdMessage("replyToMessageId"));
      }
    }

    const res = await axiosInstance.post("/api/v1/chat-mgt/message/send", {
      ...payload,
      chatId,
      content: payload.content?.trim() || "",
      fileData: payload.fileData?.trim() || undefined,
      fileName: payload.fileName?.trim() || undefined,
      fileMimeType: payload.fileMimeType?.trim() || undefined,
      replyToMessageId: payload.replyToMessageId?.trim() || undefined,
    });
    const raw = res.data as ApiResponse<ApiChatMessage>;
    return { ...raw, data: normalizeMessage(raw.data) };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to send message.",
    });
  }
});

// GET /api/v1/chat-mgt/history/{chatId}?page=&limit=
export const getChatHistory = createAsyncThunk<
  ChatHistoryResponse,
  { chatId: string; page?: number; limit?: number },
  { rejectValue: RejectValue }
>(
  "chat/getChatHistory",
  async ({ chatId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const id = chatId?.trim();
      if (!id || !isValidObjectId(id)) {
        return rejectWithValue(invalidIdMessage("chatId"));
      }
      const res = await axiosInstance.get(`/api/v1/chat-mgt/history/${id}`, {
        params: { page, limit },
      });
      const raw = res.data as {
        success: boolean;
        data: ApiChatMessage[];
        pagination?: ApiPagination;
      };
      return {
        success: raw.success,
        data: Array.isArray(raw.data) ? raw.data.map(normalizeMessage) : [],
        pagination: normalizePagination(raw.pagination),
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to load chat history.",
      });
    }
  },
);

// GET /api/v1/chat-mgt/user/chats?status=
export const getUserChats = createAsyncThunk<
  ChatsListResponse,
  { status?: ChatStatus },
  { rejectValue: RejectValue }
>("chat/getUserChats", async ({ status }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get("/api/v1/chat-mgt/user/chats", {
      params: status ? { status } : undefined,
    });
    const raw = res.data as {
      success: boolean;
      data: ApiChat[];
      pagination?: ApiPagination;
    };
    return {
      success: raw.success,
      data: Array.isArray(raw.data) ? raw.data.map(normalizeChat) : [],
      pagination: raw.pagination
        ? normalizePagination(raw.pagination)
        : undefined,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to load chats.",
    });
  }
});

// GET /api/v1/chat-mgt/agent/chats?assigned-only=
export const getAgentChats = createAsyncThunk<
  ChatsListResponse,
  { assignedOnly?: boolean },
  { rejectValue: RejectValue }
>("chat/getAgentChats", async ({ assignedOnly }, { rejectWithValue }) => {
  try {
    const params =
      typeof assignedOnly === "boolean"
        ? { "assigned-only": String(assignedOnly) }
        : undefined;
    const res = await axiosInstance.get("/api/v1/chat-mgt/agent/chats", {
      params,
    });
    const raw = res.data as {
      success: boolean;
      data: ApiChat[];
      pagination?: ApiPagination;
    };
    return {
      success: raw.success,
      data: Array.isArray(raw.data) ? raw.data.map(normalizeChat) : [],
      pagination: raw.pagination
        ? normalizePagination(raw.pagination)
        : undefined,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to load agent chats.",
    });
  }
});

// GET /api/v1/chat-mgt/{chatId}
export const getChatById = createAsyncThunk<
  ApiResponse<Chat>,
  { chatId: string },
  { rejectValue: RejectValue }
>("chat/getChatById", async ({ chatId }, { rejectWithValue }) => {
  try {
    const id = chatId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("chatId"));
    }
    const res = await axiosInstance.get(`/api/v1/chat-mgt/${id}`);
    const raw = res.data as ApiResponse<ApiChat>;
    return { ...raw, data: normalizeChat(raw.data) };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to load chat.",
    });
  }
});

// PUT /api/v1/chat-mgt/{chatId}/assign
export const assignChat = createAsyncThunk<
  ApiResponse<Chat>,
  AssignChatPayload,
  { rejectValue: RejectValue }
>(
  "chat/assignChat",
  async ({ chatId }, { rejectWithValue }) => {
    try {
      const id = chatId?.trim();
      if (!id || !isValidObjectId(id)) {
        return rejectWithValue(invalidIdMessage("chatId"));
      }
      const res = await axiosInstance.put(`/api/v1/chat-mgt/${id}/assign`, {
        chatId: id,
      });
      const raw = res.data as ApiResponse<ApiChat>;
      return { ...raw, data: normalizeChat(raw.data) };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to assign chat.",
      });
    }
  },
);

// PUT /api/v1/chat-mgt/{chatId}/status
export const updateChatStatus = createAsyncThunk<
  ApiResponse<Chat>,
  UpdateChatStatusPayload,
  { rejectValue: RejectValue }
>("chat/updateChatStatus", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.chatId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("chatId"));
    }
    const res = await axiosInstance.put(`/api/v1/chat-mgt/${id}/status`, {
      chatId: id,
      status: payload.status,
      closureReason: payload.closureReason?.trim() || undefined,
    });
    const raw = res.data as ApiResponse<ApiChat>;
    return { ...raw, data: normalizeChat(raw.data) };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to update chat status.",
    });
  }
});

// PUT /api/v1/chat-mgt/{chatId}/close
export const closeChat = createAsyncThunk<
  ApiResponse<Chat>,
  { chatId: string },
  { rejectValue: RejectValue }
>("chat/closeChat", async ({ chatId }, { rejectWithValue }) => {
  try {
    const id = chatId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("chatId"));
    }
    const res = await axiosInstance.put(`/api/v1/chat-mgt/${id}/close`, {});
    const raw = res.data as ApiResponse<ApiChat>;
    return { ...raw, data: normalizeChat(raw.data) };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to close chat.",
    });
  }
});

// DELETE /api/v1/chat-mgt/message/{messageId}
export const deleteMessage = createAsyncThunk<
  ApiResponse<{ messageId: string }>,
  { messageId: string },
  { rejectValue: RejectValue }
>("chat/deleteMessage", async ({ messageId }, { rejectWithValue }) => {
  try {
    const id = messageId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("messageId"));
    }
    const res = await axiosInstance.delete(`/api/v1/chat-mgt/message/${id}`);
    // Backend may not echo messageId; normalize for reducer use.
    const raw = (res.data ?? {}) as Partial<ApiResponse<{ messageId: string }>>;
    return {
      success: raw.success ?? true,
      data: { messageId: raw.data?.messageId ?? id },
      message: raw.message,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to delete message.",
    });
  }
});
