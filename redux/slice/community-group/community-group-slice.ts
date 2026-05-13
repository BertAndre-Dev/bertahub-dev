"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ChatGroup, GroupMessage } from "@/types/community-group";
import type { ChatPagination } from "@/types/chat";
import {
  addGroupMembers,
  createChatGroup,
  deleteChatGroup,
  deleteGroupMessage,
  editGroupMessage,
  getChatGroupById,
  getChatGroups,
  getGroupMessages,
  promoteGroupAdmin,
  removeGroupMembers,
  sendGroupMessage,
  updateChatGroup,
} from "@/redux/slice/community-group/community-group-thunks";

type LoadingState = "idle" | "isLoading" | "succeeded" | "failed";

interface CommunityGroupState {
  groups: ChatGroup[];
  listLoading: LoadingState;
  listPagination: ChatPagination | null;

  groupDetail: ChatGroup | null;
  detailLoading: LoadingState;

  createLoading: LoadingState;
  updateLoading: LoadingState;
  deleteLoading: LoadingState;

  activeMessagesGroupId: string | null;
  groupMessages: GroupMessage[];
  messagesLoading: LoadingState;
  messagesPagination: ChatPagination | null;
  sendMessageLoading: LoadingState;
  editMessageLoading: LoadingState;
  deleteMessageLoading: LoadingState;
  membersActionLoading: LoadingState;

  error: string | null;
}

const initialPagination: ChatPagination = {
  total: 0,
  page: 1,
  limit: 50,
  pages: 0,
};

const initialState: CommunityGroupState = {
  groups: [],
  listLoading: "idle",
  listPagination: null,

  groupDetail: null,
  detailLoading: "idle",

  createLoading: "idle",
  updateLoading: "idle",
  deleteLoading: "idle",

  activeMessagesGroupId: null,
  groupMessages: [],
  messagesLoading: "idle",
  messagesPagination: initialPagination,
  sendMessageLoading: "idle",
  editMessageLoading: "idle",
  deleteMessageLoading: "idle",
  membersActionLoading: "idle",

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

const communityGroupSlice = createSlice({
  name: "communityGroup",
  initialState,
  reducers: {
    clearGroupDetail: (state) => {
      state.groupDetail = null;
      state.detailLoading = "idle";
    },
    clearCommunityGroupError: (state) => {
      state.error = null;
    },
    clearGroups: (state) => {
      state.groups = [];
      state.listPagination = null;
    },
    clearGroupMessages: (state) => {
      state.groupMessages = [];
      state.activeMessagesGroupId = null;
      state.messagesPagination = initialPagination;
      state.messagesLoading = "idle";
    },
    patchLocalGroup: (
      state,
      action: PayloadAction<{ groupId: string; partial: Partial<ChatGroup> }>,
    ) => {
      const { groupId, partial } = action.payload;
      state.groups = state.groups.map((g) =>
        g._id === groupId ? { ...g, ...partial } : g,
      );
      if (state.groupDetail?._id === groupId) {
        state.groupDetail = { ...state.groupDetail, ...partial };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getChatGroups.pending, (state) => {
        state.listLoading = "isLoading";
        state.error = null;
      })
      .addCase(getChatGroups.fulfilled, (state, action) => {
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
      .addCase(getChatGroups.rejected, (state, action) => {
        state.listLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load groups.";
      })

      .addCase(getChatGroupById.pending, (state) => {
        state.detailLoading = "isLoading";
        state.error = null;
      })
      .addCase(getChatGroupById.fulfilled, (state, action) => {
        state.detailLoading = "succeeded";
        state.groupDetail = action.payload.data;
        state.groups = upsertGroup(state.groups, action.payload.data);
      })
      .addCase(getChatGroupById.rejected, (state, action) => {
        state.detailLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load group.";
      })

      .addCase(createChatGroup.pending, (state) => {
        state.createLoading = "isLoading";
        state.error = null;
      })
      .addCase(createChatGroup.fulfilled, (state, action) => {
        state.createLoading = "succeeded";
        const g = action.payload.data;
        state.groups = upsertGroup(state.groups, g);
      })
      .addCase(createChatGroup.rejected, (state, action) => {
        state.createLoading = "failed";
        state.error = action.payload?.message ?? "Failed to create group.";
      })

      .addCase(updateChatGroup.pending, (state) => {
        state.updateLoading = "isLoading";
        state.error = null;
      })
      .addCase(updateChatGroup.fulfilled, (state, action) => {
        state.updateLoading = "succeeded";
        const g = action.payload.data;
        state.groups = upsertGroup(state.groups, g);
        if (state.groupDetail?._id === g._id) {
          state.groupDetail = g;
        }
      })
      .addCase(updateChatGroup.rejected, (state, action) => {
        state.updateLoading = "failed";
        state.error = action.payload?.message ?? "Failed to update group.";
      })

      .addCase(deleteChatGroup.pending, (state) => {
        state.deleteLoading = "isLoading";
        state.error = null;
      })
      .addCase(deleteChatGroup.fulfilled, (state, action) => {
        state.deleteLoading = "succeeded";
        const id = action.meta.arg.groupId;
        state.groups = state.groups.filter((g) => g._id !== id);
        if (state.groupDetail?._id === id) {
          state.groupDetail = null;
        }
        if (state.activeMessagesGroupId === id) {
          state.groupMessages = [];
          state.activeMessagesGroupId = null;
        }
      })
      .addCase(deleteChatGroup.rejected, (state, action) => {
        state.deleteLoading = "failed";
        state.error = action.payload?.message ?? "Failed to delete group.";
      })

      // messages
      .addCase(getGroupMessages.pending, (state, action) => {
        state.messagesLoading = "isLoading";
        state.error = null;
        const gid = action.meta.arg.groupId;
        state.activeMessagesGroupId = gid;
        if ((action.meta.arg.page ?? 1) <= 1) {
          state.groupMessages = [];
        }
      })
      .addCase(getGroupMessages.fulfilled, (state, action) => {
        const { groupId, page = 1 } = action.meta.arg;
        if (groupId !== state.activeMessagesGroupId) {
          return;
        }
        state.messagesLoading = "succeeded";
        const incoming = action.payload.data;
        if (page <= 1) {
          state.groupMessages = sortMessagesAsc(incoming);
        } else {
          state.groupMessages = sortMessagesAsc([
            ...state.groupMessages,
            ...incoming,
          ]);
        }
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
      .addCase(getGroupMessages.rejected, (state, action) => {
        state.messagesLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load messages.";
      })

      .addCase(sendGroupMessage.pending, (state) => {
        state.sendMessageLoading = "isLoading";
        state.error = null;
      })
      .addCase(sendGroupMessage.fulfilled, (state, action) => {
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
      .addCase(sendGroupMessage.rejected, (state, action) => {
        state.sendMessageLoading = "failed";
        state.error = action.payload?.message ?? "Failed to send message.";
      })

      .addCase(editGroupMessage.pending, (state) => {
        state.editMessageLoading = "isLoading";
        state.error = null;
      })
      .addCase(editGroupMessage.fulfilled, (state, action) => {
        state.editMessageLoading = "succeeded";
        const updated = action.payload.data;
        state.groupMessages = state.groupMessages.map((m) =>
          m._id === updated._id ? { ...m, ...updated } : m,
        );
      })
      .addCase(editGroupMessage.rejected, (state, action) => {
        state.editMessageLoading = "failed";
        state.error = action.payload?.message ?? "Failed to edit message.";
      })

      .addCase(deleteGroupMessage.pending, (state) => {
        state.deleteMessageLoading = "isLoading";
        state.error = null;
      })
      .addCase(deleteGroupMessage.fulfilled, (state, action) => {
        state.deleteMessageLoading = "succeeded";
        const id = action.meta.arg.messageId;
        state.groupMessages = state.groupMessages.filter((m) => m._id !== id);
      })
      .addCase(deleteGroupMessage.rejected, (state, action) => {
        state.deleteMessageLoading = "failed";
        state.error = action.payload?.message ?? "Failed to delete message.";
      })

      // members / promote
      .addCase(addGroupMembers.pending, (state) => {
        state.membersActionLoading = "isLoading";
        state.error = null;
      })
      .addCase(addGroupMembers.fulfilled, (state) => {
        state.membersActionLoading = "succeeded";
      })
      .addCase(addGroupMembers.rejected, (state, action) => {
        state.membersActionLoading = "failed";
        state.error = action.payload?.message ?? "Failed to add members.";
      })
      .addCase(removeGroupMembers.pending, (state) => {
        state.membersActionLoading = "isLoading";
        state.error = null;
      })
      .addCase(removeGroupMembers.fulfilled, (state) => {
        state.membersActionLoading = "succeeded";
      })
      .addCase(removeGroupMembers.rejected, (state, action) => {
        state.membersActionLoading = "failed";
        state.error = action.payload?.message ?? "Failed to remove members.";
      })
      .addCase(promoteGroupAdmin.pending, (state) => {
        state.membersActionLoading = "isLoading";
        state.error = null;
      })
      .addCase(promoteGroupAdmin.fulfilled, (state) => {
        state.membersActionLoading = "succeeded";
      })
      .addCase(promoteGroupAdmin.rejected, (state, action) => {
        state.membersActionLoading = "failed";
        state.error = action.payload?.message ?? "Failed to promote member.";
      });
  },
});

export const {
  clearGroupDetail,
  clearCommunityGroupError,
  clearGroups,
  clearGroupMessages,
  patchLocalGroup,
} = communityGroupSlice.actions;

export default communityGroupSlice.reducer;
