"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ChatGroup, GroupMessage } from "@/types/community-group";
import type {
  SocketGroupAddedPayload,
  SocketGroupDeletedPayload,
  SocketGroupRemovedPayload,
  SocketGroupUpdatedPayload,
  SocketMessageDeletedPayload,
  SocketMessageEditedPayload,
  SocketMessageReceivedPayload,
  SocketMessagesReadPayload,
} from "@/types/community-chat-socket";
import { socketMessageToGroupMessage } from "@/lib/community-chat-socket-map";
import type { ChatPagination } from "@/types/chat";
import {
  deleteStaffGroupMessage,
  editStaffGroupMessage,
  getStaffChatGroupById,
  getStaffChatGroups,
  getStaffGroupMessages,
  sendStaffGroupMessage,
} from "./staff-community-thunks";

type LoadingState = "idle" | "isLoading" | "succeeded" | "failed";

interface StaffCommunityState {
  groups: ChatGroup[];
  listLoading: LoadingState;
  listPagination: ChatPagination | null;
  groupDetail: ChatGroup | null;
  detailLoading: LoadingState;
  activeMessagesGroupId: string | null;
  groupMessages: GroupMessage[];
  messagesLoading: LoadingState;
  messagesPagination: ChatPagination | null;
  sendMessageLoading: LoadingState;
  editMessageLoading: LoadingState;
  deleteMessageLoading: LoadingState;
  error: string | null;
}

const initialPagination: ChatPagination = {
  total: 0,
  page: 1,
  limit: 50,
  pages: 0,
};

const initialState: StaffCommunityState = {
  groups: [],
  listLoading: "idle",
  listPagination: null,
  groupDetail: null,
  detailLoading: "idle",
  activeMessagesGroupId: null,
  groupMessages: [],
  messagesLoading: "idle",
  messagesPagination: initialPagination,
  sendMessageLoading: "idle",
  editMessageLoading: "idle",
  deleteMessageLoading: "idle",
  error: null,
};

function upsertGroup(list: ChatGroup[], g: ChatGroup): ChatGroup[] {
  const idx = list.findIndex((x) => x._id === g._id);
  if (idx === -1) return [g, ...list];
  const next = list.slice();
  next[idx] = { ...next[idx], ...g };
  return next;
}

function sortMessagesAsc(list: GroupMessage[]): GroupMessage[] {
  return [...list].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

const staffCommunitySlice = createSlice({
  name: "staffCommunity",
  initialState,
  reducers: {
    clearStaffGroupDetail: (state) => {
      state.groupDetail = null;
      state.detailLoading = "idle";
    },
    clearStaffCommunityError: (state) => {
      state.error = null;
    },
    clearStaffGroupMessages: (state) => {
      state.groupMessages = [];
      state.activeMessagesGroupId = null;
      state.messagesPagination = initialPagination;
      state.messagesLoading = "idle";
    },
    staffSocketMessageReceived: (
      state,
      action: PayloadAction<{
        payload: SocketMessageReceivedPayload;
        currentUserId?: string | null;
      }>,
    ) => {
      const { payload, currentUserId } = action.payload;
      const msg = socketMessageToGroupMessage(payload);
      const gid = payload.groupId;

      if (state.activeMessagesGroupId === gid) {
        const exists = state.groupMessages.some((m) => m._id === msg._id);
        if (!exists) {
          state.groupMessages = sortMessagesAsc([...state.groupMessages, msg]);
        }
      }

      const preview = (msg.content || "").slice(0, 120);
      state.groups = state.groups.map((g) => {
        if (g._id !== gid) return g;
        const isOwn = currentUserId && msg.senderId === currentUserId;
        const isActive = state.activeMessagesGroupId === gid;
        const unreadDelta =
          !isActive && !isOwn ? (g.unreadCount ?? 0) + 1 : 0;
        return {
          ...g,
          lastMessagePreview: preview || g.lastMessagePreview,
          unreadCount: unreadDelta > 0 ? unreadDelta : g.unreadCount,
        };
      });
      if (state.groupDetail?._id === gid) {
        state.groupDetail = {
          ...state.groupDetail,
          lastMessagePreview: preview || state.groupDetail.lastMessagePreview,
        };
      }
    },
    staffSocketMessageEdited: (
      state,
      action: PayloadAction<SocketMessageEditedPayload>,
    ) => {
      const { messageId, groupId, content } = action.payload;
      if (state.activeMessagesGroupId !== groupId) return;
      state.groupMessages = state.groupMessages.map((m) =>
        m._id === messageId ? { ...m, content, isEdited: true } : m,
      );
    },
    staffSocketMessageDeleted: (
      state,
      action: PayloadAction<SocketMessageDeletedPayload>,
    ) => {
      const { messageId, groupId } = action.payload;
      if (state.activeMessagesGroupId !== groupId) return;
      state.groupMessages = state.groupMessages.filter(
        (m) => m._id !== messageId,
      );
    },
    staffSocketMessagesRead: (
      state,
      action: PayloadAction<SocketMessagesReadPayload>,
    ) => {
      const { groupId, userId, messageIds } = action.payload;
      if (state.activeMessagesGroupId !== groupId) return;
      const ids = new Set(messageIds);
      state.groupMessages = state.groupMessages.map((m) =>
        ids.has(m._id)
          ? {
              ...m,
              readBy: [...new Set([...(m.readBy ?? []), userId])],
            }
          : m,
      );
    },
    staffSocketGroupAdded: (
      state,
      action: PayloadAction<SocketGroupAddedPayload>,
    ) => {
      const { groupId, name, description, profileImage } = action.payload;
      if (state.groups.some((g) => g._id === groupId)) return;
      state.groups = [
        {
          _id: groupId,
          name: name || "New group",
          description,
          profileImage,
          memberCount: 0,
          unreadCount: 0,
        },
        ...state.groups,
      ];
    },
    staffSocketGroupRemoved: (
      state,
      action: PayloadAction<SocketGroupRemovedPayload>,
    ) => {
      const { groupId } = action.payload;
      state.groups = state.groups.filter((g) => g._id !== groupId);
      if (state.groupDetail?._id === groupId) state.groupDetail = null;
      if (state.activeMessagesGroupId === groupId) {
        state.groupMessages = [];
        state.activeMessagesGroupId = null;
      }
    },
    staffSocketGroupUpdated: (
      state,
      action: PayloadAction<SocketGroupUpdatedPayload>,
    ) => {
      const { groupId, name, description, profileImage } = action.payload;
      const partial: Partial<ChatGroup> = {};
      if (name != null) partial.name = name;
      if (description !== undefined) partial.description = description;
      if (profileImage !== undefined) partial.profileImage = profileImage;
      state.groups = state.groups.map((g) =>
        g._id === groupId ? { ...g, ...partial } : g,
      );
      if (state.groupDetail?._id === groupId) {
        state.groupDetail = { ...state.groupDetail, ...partial };
      }
    },
    staffSocketGroupDeleted: (
      state,
      action: PayloadAction<SocketGroupDeletedPayload>,
    ) => {
      const { groupId } = action.payload;
      state.groups = state.groups.filter((g) => g._id !== groupId);
      if (state.groupDetail?._id === groupId) state.groupDetail = null;
      if (state.activeMessagesGroupId === groupId) {
        state.groupMessages = [];
        state.activeMessagesGroupId = null;
      }
    },
    clearStaffGroupUnread: (state, action: PayloadAction<{ groupId: string }>) => {
      const { groupId } = action.payload;
      state.groups = state.groups.map((g) =>
        g._id === groupId ? { ...g, unreadCount: 0 } : g,
      );
    },
    resetStaffCommunityState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStaffChatGroups.pending, (state) => {
        state.listLoading = "isLoading";
        state.error = null;
      })
      .addCase(getStaffChatGroups.fulfilled, (state, action) => {
        state.listLoading = "succeeded";
        state.groups = action.payload.data;
        const p = action.payload.pagination;
        if (p) {
          state.listPagination = {
            total: p.total,
            page: p.page,
            limit: p.limit,
            pages: p.pages,
          };
        }
      })
      .addCase(getStaffChatGroups.rejected, (state, action) => {
        state.listLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load groups.";
      })

      .addCase(getStaffChatGroupById.pending, (state) => {
        state.detailLoading = "isLoading";
        state.error = null;
      })
      .addCase(getStaffChatGroupById.fulfilled, (state, action) => {
        state.detailLoading = "succeeded";
        state.groupDetail = action.payload.data;
        state.groups = upsertGroup(state.groups, action.payload.data);
      })
      .addCase(getStaffChatGroupById.rejected, (state, action) => {
        state.detailLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load group.";
      })

      .addCase(getStaffGroupMessages.pending, (state, action) => {
        state.messagesLoading = "isLoading";
        state.error = null;
        const gid = action.meta.arg.groupId;
        state.activeMessagesGroupId = gid;
        if ((action.meta.arg.page ?? 1) <= 1) {
          state.groupMessages = [];
        }
      })
      .addCase(getStaffGroupMessages.fulfilled, (state, action) => {
        const { groupId, page = 1 } = action.meta.arg;
        if (groupId !== state.activeMessagesGroupId) return;
        state.messagesLoading = "succeeded";
        const incoming = action.payload.data;
        state.groupMessages =
          page <= 1
            ? sortMessagesAsc(incoming)
            : sortMessagesAsc([...state.groupMessages, ...incoming]);
        const p = action.payload.pagination;
        if (p) {
          state.messagesPagination = {
            total: p.total,
            page: p.page,
            limit: p.limit,
            pages: p.pages,
          };
        }
      })
      .addCase(getStaffGroupMessages.rejected, (state, action) => {
        state.messagesLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load messages.";
      })

      .addCase(sendStaffGroupMessage.pending, (state) => {
        state.sendMessageLoading = "isLoading";
        state.error = null;
      })
      .addCase(sendStaffGroupMessage.fulfilled, (state, action) => {
        state.sendMessageLoading = "succeeded";
        const gid = action.meta.arg.groupId;
        const msg = action.payload.data;
        if (state.activeMessagesGroupId === gid && msg) {
          const exists = state.groupMessages.some((m) => m._id === msg._id);
          if (!exists) {
            state.groupMessages = sortMessagesAsc([
              ...state.groupMessages,
              msg,
            ]);
          }
        }
      })
      .addCase(sendStaffGroupMessage.rejected, (state, action) => {
        state.sendMessageLoading = "failed";
        state.error = action.payload?.message ?? "Failed to send message.";
      })

      .addCase(editStaffGroupMessage.pending, (state) => {
        state.editMessageLoading = "isLoading";
        state.error = null;
      })
      .addCase(editStaffGroupMessage.fulfilled, (state, action) => {
        state.editMessageLoading = "succeeded";
        const updated = action.payload.data;
        state.groupMessages = state.groupMessages.map((m) =>
          m._id === updated._id ? { ...m, ...updated } : m,
        );
      })
      .addCase(editStaffGroupMessage.rejected, (state, action) => {
        state.editMessageLoading = "failed";
        state.error = action.payload?.message ?? "Failed to edit message.";
      })

      .addCase(deleteStaffGroupMessage.pending, (state) => {
        state.deleteMessageLoading = "isLoading";
        state.error = null;
      })
      .addCase(deleteStaffGroupMessage.fulfilled, (state, action) => {
        state.deleteMessageLoading = "succeeded";
        const id = action.meta.arg.messageId;
        state.groupMessages = state.groupMessages.filter((m) => m._id !== id);
      })
      .addCase(deleteStaffGroupMessage.rejected, (state, action) => {
        state.deleteMessageLoading = "failed";
        state.error = action.payload?.message ?? "Failed to delete message.";
      });
  },
});

export const {
  clearStaffGroupDetail,
  clearStaffCommunityError,
  clearStaffGroupMessages,
  staffSocketMessageReceived,
  staffSocketMessageEdited,
  staffSocketMessageDeleted,
  staffSocketMessagesRead,
  staffSocketGroupAdded,
  staffSocketGroupRemoved,
  staffSocketGroupUpdated,
  staffSocketGroupDeleted,
  clearStaffGroupUnread,
  resetStaffCommunityState,
} = staffCommunitySlice.actions;

export default staffCommunitySlice.reducer;
