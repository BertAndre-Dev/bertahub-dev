import { createAsyncThunk } from "@reduxjs/toolkit";

import axiosInstance from "@/utils/axiosInstance";
import type {
  AddGroupMembersPayload,
  ChatGroup,
  ChatGroupMemberUser,
  ChatGroupsListResponse,
  CreateChatGroupPayload,
  EditGroupMessagePayload,
  GroupMessage,
  GroupMessageAttachment,
  GroupMessagesListResponse,
  PromoteGroupAdminPayload,
  RemoveGroupMembersPayload,
  ReplyToGroupMessagePayload,
  SendGroupMessagePayload,
  UpdateChatGroupPayload,
} from "@/types/community-group";

type RejectValue = { message: string };

type ApiResponse<T> = { success: boolean; data: T; message?: string };

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function isValidObjectId(id: string): boolean {
  return OBJECT_ID_RE.test(id);
}

export function isValidCommunityObjectId(id: string): boolean {
  return isValidObjectId(id);
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

type ApiChatGroupMember = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type ApiChatGroup = {
  id?: string;
  _id?: string;
  name?: string;
  description?: string;
  profileImage?: string;
  estateId?: string;
  createdBy?: string;
  /** Legacy: string ids; current API: populated user objects. */
  members?: (string | ApiChatGroupMember)[];
  admins?: (string | ApiChatGroupMember)[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  memberCount?: number;
  membersCount?: number;
  unreadCount?: number;
  lastMessage?: string;
  lastMessagePreview?: string;
};

function userIdFromMemberEntry(entry: unknown): string | null {
  if (typeof entry === "string") {
    const t = entry.trim();
    return t || null;
  }
  if (entry && typeof entry === "object") {
    const o = entry as ApiChatGroupMember;
    const id = (o.id ?? o._id ?? "").toString().trim();
    return id || null;
  }
  return null;
}

function normalizeMemberUser(entry: unknown): ChatGroupMemberUser | null {
  const id = userIdFromMemberEntry(entry);
  if (!id) return null;
  if (typeof entry === "string") {
    return { id };
  }
  const o = entry as ApiChatGroupMember;
  return {
    id,
    firstName: typeof o.firstName === "string" ? o.firstName : undefined,
    lastName: typeof o.lastName === "string" ? o.lastName : undefined,
    email: typeof o.email === "string" ? o.email : undefined,
  };
}

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

/** API often omits page/limit on pagination; keep the request values. */
export function mergeCommunityApiPagination(
  api: ApiPagination | undefined,
  requestedPage: number,
  requestedLimit: number,
): { total: number; page: number; limit: number; pages: number } {
  const base = normalizePagination(api);
  const page =
    typeof api?.page === "number" ? api.page : requestedPage;
  const limit =
    typeof api?.limit === "number" ? api.limit : requestedLimit;
  let { pages, total } = base;
  if ((!pages || pages < 1) && total > 0 && limit > 0) {
    pages = Math.max(1, Math.ceil(total / limit));
  }
  return { total, page, limit, pages };
}

export function normalizeChatGroup(raw: ApiChatGroup): ChatGroup {
  const _id = (raw._id ?? raw.id ?? "").toString();
  const membersList = Array.isArray(raw.members)
    ? raw.members
        .map(normalizeMemberUser)
        .filter((m): m is ChatGroupMemberUser => m !== null)
    : [];
  const adminsIds = Array.isArray(raw.admins)
    ? raw.admins
        .map(userIdFromMemberEntry)
        .filter((id): id is string => Boolean(id))
    : [];
  const fromMembers = membersList.length;
  const memberRaw = raw.memberCount ?? raw.membersCount ?? fromMembers;
  return {
    _id,
    name: (raw.name ?? "").toString() || "Untitled group",
    description: raw.description,
    profileImage: raw.profileImage,
    estateId:
      typeof raw.estateId === "string" ? raw.estateId : undefined,
    createdBy:
      typeof raw.createdBy === "string" ? raw.createdBy : undefined,
    members: fromMembers > 0 ? membersList : undefined,
    admins: adminsIds.length > 0 ? adminsIds : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
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
      data: normalizeChatGroup(raw.data),
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
      data: list.map(normalizeChatGroup),
      pagination: mergeCommunityApiPagination(
        body.pagination ?? { total: list.length, pages: 1 },
        page,
        limit,
      ),
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
    return { ...raw, data: normalizeChatGroup(raw.data) };
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
    return { ...raw, data: normalizeChatGroup(raw.data) };
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

// ─── Group messages & members (REST) ─────────────────────────────────────────

type ApiUser = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type ApiGroupMessage = {
  id?: string;
  _id?: string;
  /** List/send response uses chatGroupId */
  chatGroupId?: string;
  groupId?: string;
  content?: string;
  messageType?: string;
  senderId?: string | ApiUser;
  sender?: string | ApiUser;
  userId?: string;
  /** Plain string senderId responses include this (e.g. send message, history) */
  senderName?: string;
  createdAt?: string;
  updatedAt?: string;
  /** API returns objects `{ url, type, mimeType, fileName }` or legacy URL strings. */
  attachments?: unknown[];
  replyTo?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  readBy?: string[];
};

function normalizeSender(u: string | ApiUser | undefined): {
  senderId: string;
  senderName: string;
} {
  if (u == null) return { senderId: "", senderName: "" };
  if (typeof u === "string") {
    return { senderId: u.trim(), senderName: "" };
  }
  const id = (u._id ?? u.id ?? "").toString();
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return {
    senderId: id,
    senderName: name || (u.email ?? "").toString() || "",
  };
}

export function normalizeAttachments(
  raw: unknown,
): GroupMessageAttachment[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: GroupMessageAttachment[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const u = item.trim();
      if (u) out.push({ url: u });
      continue;
    }
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const urlRaw =
        typeof o.url === "string"
          ? o.url
          : typeof o.src === "string"
            ? o.src
            : "";
      const url = urlRaw.trim();
      if (!url) continue;
      out.push({
        url,
        type: typeof o.type === "string" ? o.type : undefined,
        mimeType:
          typeof o.mimeType === "string"
            ? o.mimeType
            : typeof o.mimetype === "string"
              ? String(o.mimetype)
              : undefined,
        fileName:
          typeof o.fileName === "string"
            ? o.fileName
            : typeof o.filename === "string"
              ? String(o.filename)
              : undefined,
      });
    }
  }
  return out.length ? out : undefined;
}

export function normalizeGroupMessage(raw: ApiGroupMessage): GroupMessage {
  const _id = (raw._id ?? raw.id ?? "").toString();
  const explicitName =
    typeof raw.senderName === "string" ? raw.senderName.trim() : "";
  const fromSender = normalizeSender(
    raw.senderId ?? raw.sender ?? raw.userId,
  );
  const senderId = fromSender.senderId;
  const senderName =
    explicitName || fromSender.senderName || "Someone";

  return {
    _id,
    groupId: (raw.chatGroupId ?? raw.groupId)?.toString(),
    content: (raw.content ?? "").toString(),
    messageType: (raw.messageType ?? "text").toString(),
    senderId,
    senderName,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt,
    attachments: normalizeAttachments(raw.attachments),
    replyTo:
      typeof raw.replyTo === "string"
        ? raw.replyTo
        : raw.replyTo != null
          ? String(raw.replyTo)
          : undefined,
    isEdited: Boolean(raw.isEdited),
    isDeleted: Boolean(raw.isDeleted),
    readBy: Array.isArray(raw.readBy) ? raw.readBy.map(String) : undefined,
  };
}

// POST /api/v1/chat/groups/{groupId}/members
export const addGroupMembers = createAsyncThunk<
  ApiResponse<unknown>,
  AddGroupMembersPayload,
  { rejectValue: RejectValue }
>("communityGroup/addGroupMembers", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const body: Record<string, unknown> = {};
    if (payload.memberIds?.length) body.memberIds = payload.memberIds;
    if (payload.addAllSameRole === true) {
      body.addAllSameRole = true;
      if (payload.roleToAdd) body.roleToAdd = payload.roleToAdd;
    }
    if (!payload.memberIds?.length && payload.addAllSameRole !== true) {
      return rejectWithValue({
        message: "Provide member IDs or enable add all same role.",
      });
    }
    const res = await axiosInstance.post(
      `/api/v1/chat/groups/${id}/members`,
      body,
    );
    return (res.data ?? { success: true }) as ApiResponse<unknown>;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to add members.",
    });
  }
});

// DELETE /api/v1/chat/groups/{groupId}/members
export const removeGroupMembers = createAsyncThunk<
  ApiResponse<unknown>,
  RemoveGroupMembersPayload,
  { rejectValue: RejectValue }
>("communityGroup/removeGroupMembers", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    if (!payload.memberIds?.length) {
      return rejectWithValue({ message: "At least one member ID is required." });
    }
    const res = await axiosInstance.delete(
      `/api/v1/chat/groups/${id}/members`,
      { data: { memberIds: payload.memberIds } },
    );
    return (res.data ?? { success: true }) as ApiResponse<unknown>;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to remove members.",
    });
  }
});

// POST /api/v1/chat/groups/{groupId}/promote-admin
export const promoteGroupAdmin = createAsyncThunk<
  ApiResponse<unknown>,
  PromoteGroupAdminPayload,
  { rejectValue: RejectValue }
>("communityGroup/promoteGroupAdmin", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const uid = payload.userId?.trim();
    if (!uid || !isValidObjectId(uid)) {
      return rejectWithValue(invalidIdMessage("userId"));
    }
    const res = await axiosInstance.post(
      `/api/v1/chat/groups/${id}/promote-admin`,
      { userId: uid },
    );
    return (res.data ?? { success: true }) as ApiResponse<unknown>;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to promote member.",
    });
  }
});

// GET /api/v1/chat/groups/{groupId}/messages?page=&limit=
export const getGroupMessages = createAsyncThunk<
  GroupMessagesListResponse,
  { groupId: string; page?: number; limit?: number },
  { rejectValue: RejectValue }
>("communityGroup/getGroupMessages", async (params, { rejectWithValue }) => {
  try {
    const id = params.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const res = await axiosInstance.get(`/api/v1/chat/groups/${id}/messages`, {
      params: { page, limit },
    });
    const body = res.data as {
      success?: boolean;
      data?: ApiGroupMessage[];
      pagination?: ApiPagination;
    };
    const list = Array.isArray(body.data) ? body.data : [];
    return {
      success: body.success ?? true,
      data: list.map(normalizeGroupMessage),
      pagination: mergeCommunityApiPagination(
        body.pagination ?? { total: list.length, pages: 1 },
        page,
        limit,
      ),
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to load messages.",
    });
  }
});

// POST /api/v1/chat/groups/{groupId}/messages
export const sendGroupMessage = createAsyncThunk<
  ApiResponse<GroupMessage>,
  SendGroupMessagePayload,
  { rejectValue: RejectValue }
>("communityGroup/sendGroupMessage", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    if (!payload.content?.trim() && !payload.attachments?.length) {
      return rejectWithValue({ message: "Message content or attachment required." });
    }
    const body: Record<string, unknown> = {
      content: payload.content?.trim() ?? "",
      messageType: payload.messageType ?? "text",
    };
    if (payload.attachments?.length) body.attachments = payload.attachments;
    if (payload.replyTo?.trim()) body.replyTo = payload.replyTo.trim();
    const res = await axiosInstance.post(
      `/api/v1/chat/groups/${id}/messages`,
      body,
    );
    const raw = res.data as ApiResponse<ApiGroupMessage>;
    const data = raw.data ? normalizeGroupMessage(raw.data) : null;
    if (!data) {
      return rejectWithValue({ message: "Invalid response from server." });
    }
    return { ...raw, data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to send message.",
    });
  }
});

// POST /api/v1/chat/groups/{groupId}/messages/{messageId}/reply
export const replyToGroupMessage = createAsyncThunk<
  ApiResponse<GroupMessage>,
  ReplyToGroupMessagePayload,
  { rejectValue: RejectValue }
>("communityGroup/replyToGroupMessage", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    const messageId = payload.messageId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    if (!messageId || !isValidObjectId(messageId)) {
      return rejectWithValue(invalidIdMessage("messageId"));
    }
    if (!payload.content?.trim() && !payload.attachments?.length) {
      return rejectWithValue({ message: "Message content or attachment required." });
    }
    const body: Record<string, unknown> = {
      content: payload.content?.trim() ?? "",
      messageType: payload.messageType ?? "text",
    };
    if (payload.attachments?.length) body.attachments = payload.attachments;
    const res = await axiosInstance.post(
      `/api/v1/chat/groups/${id}/messages/${messageId}/reply`,
      body,
    );
    const raw = res.data as ApiResponse<ApiGroupMessage>;
    const data = raw.data ? normalizeGroupMessage(raw.data) : null;
    if (!data) {
      return rejectWithValue({ message: "Invalid response from server." });
    }
    return { ...raw, data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to send reply.",
    });
  }
});

// PUT /api/v1/chat/messages/{messageId}
export const editGroupMessage = createAsyncThunk<
  ApiResponse<GroupMessage>,
  EditGroupMessagePayload,
  { rejectValue: RejectValue }
>("communityGroup/editGroupMessage", async (payload, { rejectWithValue }) => {
  try {
    const mid = payload.messageId?.trim();
    if (!mid || !isValidObjectId(mid)) {
      return rejectWithValue(invalidIdMessage("messageId"));
    }
    if (!payload.content?.trim()) {
      return rejectWithValue({ message: "Content is required." });
    }
    const res = await axiosInstance.put(`/api/v1/chat/messages/${mid}`, {
      content: payload.content.trim(),
    });
    const raw = res.data as ApiResponse<ApiGroupMessage>;
    const data = raw.data ? normalizeGroupMessage(raw.data) : null;
    if (!data) {
      return rejectWithValue({ message: "Invalid response from server." });
    }
    return { ...raw, data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to edit message.",
    });
  }
});

// DELETE /api/v1/chat/messages/{messageId}
export const deleteGroupMessage = createAsyncThunk<
  ApiResponse<unknown>,
  { messageId: string },
  { rejectValue: RejectValue }
>("communityGroup/deleteGroupMessage", async ({ messageId }, { rejectWithValue }) => {
  try {
    const id = messageId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("messageId"));
    }
    const res = await axiosInstance.delete(`/api/v1/chat/messages/${id}`);
    return (res.data ?? { success: true }) as ApiResponse<unknown>;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to delete message.",
    });
  }
});
