"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ChatGroup } from "@/types/community-group";
import type { ChatPagination } from "@/types/chat";
import {
  createChatGroup,
  deleteChatGroup,
  getChatGroupById,
  getChatGroups,
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

  error: string | null;
}

const initialState: CommunityGroupState = {
  groups: [],
  listLoading: "idle",
  listPagination: null,

  groupDetail: null,
  detailLoading: "idle",

  createLoading: "idle",
  updateLoading: "idle",
  deleteLoading: "idle",

  error: null,
};

function upsertGroup(list: ChatGroup[], g: ChatGroup): ChatGroup[] {
  const idx = list.findIndex((x) => x._id === g._id);
  if (idx === -1) return [g, ...list];
  const next = list.slice();
  next[idx] = { ...next[idx], ...g };
  return next;
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
      })
      .addCase(deleteChatGroup.rejected, (state, action) => {
        state.deleteLoading = "failed";
        state.error = action.payload?.message ?? "Failed to delete group.";
      });
  },
});

export const {
  clearGroupDetail,
  clearCommunityGroupError,
  clearGroups,
  patchLocalGroup,
} = communityGroupSlice.actions;

export default communityGroupSlice.reducer;
