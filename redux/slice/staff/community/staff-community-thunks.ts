import { createAsyncThunk } from "@reduxjs/toolkit";

import axiosInstance from "@/utils/axiosInstance";
import {
  isValidCommunityObjectId,
  mergeCommunityApiPagination,
  normalizeChatGroup,
  normalizeGroupMessage,
} from "@/redux/slice/community-group/community-group-thunks";
import type {
  ChatGroup,
  ChatGroupsListResponse,
  EditGroupMessagePayload,
  GroupMessage,
  GroupMessagesListResponse,
  SendGroupMessagePayload,
} from "@/types/community-group";

type RejectValue = { message: string };

type ApiResponse<T> = { success: boolean; data: T; message?: string };

function invalidIdMessage(label: string): RejectValue {
  return { message: `Invalid ${label}.` };
}

/** GET /api/v1/chat/groups */
export const getStaffChatGroups = createAsyncThunk<
  ChatGroupsListResponse,
  { page?: number; limit?: number; search?: string },
  { rejectValue: RejectValue }
>("staffCommunity/getChatGroups", async (params, { rejectWithValue }) => {
  try {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const search = params.search?.trim() || undefined;
    const res = await axiosInstance.get("/api/v1/chat/groups", {
      params: { page, limit, search },
    });
    const body = res.data as {
      success?: boolean;
      data?: unknown[];
      pagination?: Record<string, unknown>;
    };
    const list = Array.isArray(body.data) ? body.data : [];
    return {
      success: body.success ?? true,
      data: list.map((item) => normalizeChatGroup(item as Parameters<typeof normalizeChatGroup>[0])),
      pagination: mergeCommunityApiPagination(
        body.pagination as Parameters<typeof mergeCommunityApiPagination>[0],
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

/** GET /api/v1/chat/groups/{groupId} */
export const getStaffChatGroupById = createAsyncThunk<
  ApiResponse<ChatGroup>,
  { groupId: string },
  { rejectValue: RejectValue }
>("staffCommunity/getChatGroupById", async ({ groupId }, { rejectWithValue }) => {
  try {
    const id = groupId?.trim();
    if (!id || !isValidCommunityObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const res = await axiosInstance.get(`/api/v1/chat/groups/${id}`);
    const raw = res.data as ApiResponse<Parameters<typeof normalizeChatGroup>[0]>;
    return { ...raw, data: normalizeChatGroup(raw.data) };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to load group.",
    });
  }
});

/** GET /api/v1/chat/groups/{groupId}/messages */
export const getStaffGroupMessages = createAsyncThunk<
  GroupMessagesListResponse,
  { groupId: string; page?: number; limit?: number },
  { rejectValue: RejectValue }
>("staffCommunity/getGroupMessages", async (params, { rejectWithValue }) => {
  try {
    const id = params.groupId?.trim();
    if (!id || !isValidCommunityObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const res = await axiosInstance.get(`/api/v1/chat/groups/${id}/messages`, {
      params: { page, limit },
    });
    const body = res.data as {
      success?: boolean;
      data?: unknown[];
      pagination?: Record<string, unknown>;
    };
    const list = Array.isArray(body.data) ? body.data : [];
    return {
      success: body.success ?? true,
      data: list.map((item) =>
        normalizeGroupMessage(item as Parameters<typeof normalizeGroupMessage>[0]),
      ),
      pagination: mergeCommunityApiPagination(
        body.pagination as Parameters<typeof mergeCommunityApiPagination>[0],
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

/** POST /api/v1/chat/groups/{groupId}/messages */
export const sendStaffGroupMessage = createAsyncThunk<
  ApiResponse<GroupMessage>,
  SendGroupMessagePayload,
  { rejectValue: RejectValue }
>("staffCommunity/sendGroupMessage", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    if (!id || !isValidCommunityObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    if (!payload.content?.trim() && !payload.attachments?.length) {
      return rejectWithValue({
        message: "Message content or attachment required.",
      });
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
    const raw = res.data as ApiResponse<Parameters<typeof normalizeGroupMessage>[0]>;
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

/** PUT /api/v1/chat/messages/{messageId} */
export const editStaffGroupMessage = createAsyncThunk<
  ApiResponse<GroupMessage>,
  EditGroupMessagePayload,
  { rejectValue: RejectValue }
>("staffCommunity/editGroupMessage", async (payload, { rejectWithValue }) => {
  try {
    const mid = payload.messageId?.trim();
    if (!mid || !isValidCommunityObjectId(mid)) {
      return rejectWithValue(invalidIdMessage("messageId"));
    }
    if (!payload.content?.trim()) {
      return rejectWithValue({ message: "Content is required." });
    }
    const res = await axiosInstance.put(`/api/v1/chat/messages/${mid}`, {
      content: payload.content.trim(),
    });
    const raw = res.data as ApiResponse<Parameters<typeof normalizeGroupMessage>[0]>;
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

/** DELETE /api/v1/chat/messages/{messageId} */
export const deleteStaffGroupMessage = createAsyncThunk<
  ApiResponse<unknown>,
  { messageId: string },
  { rejectValue: RejectValue }
>("staffCommunity/deleteGroupMessage", async ({ messageId }, { rejectWithValue }) => {
  try {
    const id = messageId?.trim();
    if (!id || !isValidCommunityObjectId(id)) {
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
