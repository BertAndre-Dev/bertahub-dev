"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { Chat, ChatMessage, ChatPagination } from "@/types/chat";
import {
  assignChat,
  closeChat,
  createChat,
  deleteMessage,
  getAgentChats,
  getChatById,
  getChatHistory,
  getUserChats,
  sendMessage,
  updateChatStatus,
} from "@/redux/slice/chat/chat-thunks";

type LoadingState = "idle" | "isLoading" | "succeeded" | "failed";

interface ChatState {
  chats: Chat[];
  chatsLoading: LoadingState;

  activeChat: Chat | null;
  activeChatLoading: LoadingState;

  messages: ChatMessage[];
  messagesPagination: ChatPagination;
  messagesLoading: LoadingState;

  sendMessageLoading: LoadingState;
  createChatLoading: LoadingState;

  error: string | null;
}

const initialPagination: ChatPagination = {
  total: 0,
  page: 1,
  limit: 20,
  pages: 0,
};

const initialState: ChatState = {
  chats: [],
  chatsLoading: "idle",

  activeChat: null,
  activeChatLoading: "idle",

  messages: [],
  messagesPagination: initialPagination,
  messagesLoading: "idle",

  sendMessageLoading: "idle",
  createChatLoading: "idle",

  error: null,
};

function upsertChatInList(list: Chat[], updated: Chat): Chat[] {
  const idx = list.findIndex((c) => c._id === updated._id);
  if (idx === -1) return list;
  const next = list.slice();
  next[idx] = { ...next[idx], ...updated };
  return next;
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<Chat | null>) => {
      state.activeChat = action.payload;
      state.error = null;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.messagesPagination = initialPagination;
      state.messagesLoading = "idle";
    },
    clearChatError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ===== createChat =====
      .addCase(createChat.pending, (state) => {
        state.createChatLoading = "isLoading";
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.createChatLoading = "succeeded";
        const chat = action.payload.data;
        state.chats = [chat, ...state.chats.filter((c) => c._id !== chat._id)];
        state.activeChat = chat;
      })
      .addCase(createChat.rejected, (state, action) => {
        state.createChatLoading = "failed";
        state.error = action.payload?.message ?? "Failed to create chat.";
      })

      // ===== sendMessage =====
      .addCase(sendMessage.pending, (state) => {
        state.sendMessageLoading = "isLoading";
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendMessageLoading = "succeeded";
        const msg = action.payload.data;
        state.messages = [...state.messages, msg];
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendMessageLoading = "failed";
        state.error = action.payload?.message ?? "Failed to send message.";
      })

      // ===== getChatHistory =====
      .addCase(getChatHistory.pending, (state) => {
        state.messagesLoading = "isLoading";
        state.error = null;
      })
      .addCase(getChatHistory.fulfilled, (state, action) => {
        state.messagesLoading = "succeeded";
        const page = action.meta.arg.page ?? 1;
        const payload = action.payload;

        state.messagesPagination = payload.pagination;
        if (page <= 1) {
          state.messages = payload.data;
        } else {
          state.messages = [...payload.data, ...state.messages];
        }
      })
      .addCase(getChatHistory.rejected, (state, action) => {
        state.messagesLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load messages.";
      })

      // ===== list chats =====
      .addCase(getUserChats.pending, (state) => {
        state.chatsLoading = "isLoading";
        state.error = null;
      })
      .addCase(getUserChats.fulfilled, (state, action) => {
        state.chatsLoading = "succeeded";
        state.chats = action.payload.data;
      })
      .addCase(getUserChats.rejected, (state, action) => {
        state.chatsLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load chats.";
      })
      .addCase(getAgentChats.pending, (state) => {
        state.chatsLoading = "isLoading";
        state.error = null;
      })
      .addCase(getAgentChats.fulfilled, (state, action) => {
        state.chatsLoading = "succeeded";
        state.chats = action.payload.data;
      })
      .addCase(getAgentChats.rejected, (state, action) => {
        state.chatsLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load chats.";
      })

      // ===== getChatById =====
      .addCase(getChatById.pending, (state) => {
        state.activeChatLoading = "isLoading";
        state.error = null;
      })
      .addCase(getChatById.fulfilled, (state, action) => {
        state.activeChatLoading = "succeeded";
        state.activeChat = action.payload.data;
      })
      .addCase(getChatById.rejected, (state, action) => {
        state.activeChatLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load chat.";
      })

      // ===== updateChatStatus =====
      .addCase(updateChatStatus.pending, (state) => {
        state.activeChatLoading = "isLoading";
        state.error = null;
      })
      .addCase(updateChatStatus.fulfilled, (state, action) => {
        state.activeChatLoading = "succeeded";
        const updated = action.payload.data;
        state.chats = upsertChatInList(state.chats, updated);
        if (state.activeChat?._id === updated._id) {
          state.activeChat = { ...state.activeChat, ...updated };
        }
      })
      .addCase(updateChatStatus.rejected, (state, action) => {
        state.activeChatLoading = "failed";
        state.error = action.payload?.message ?? "Failed to update chat status.";
      })

      // ===== closeChat =====
      .addCase(closeChat.pending, (state) => {
        state.activeChatLoading = "isLoading";
        state.error = null;
      })
      .addCase(closeChat.fulfilled, (state, action) => {
        state.activeChatLoading = "succeeded";
        const updated = action.payload.data;
        state.chats = upsertChatInList(state.chats, updated);
        if (state.activeChat?._id === updated._id) {
          state.activeChat = { ...state.activeChat, ...updated };
        }
      })
      .addCase(closeChat.rejected, (state, action) => {
        state.activeChatLoading = "failed";
        state.error = action.payload?.message ?? "Failed to close chat.";
      })

      // ===== assignChat =====
      .addCase(assignChat.pending, (state) => {
        state.activeChatLoading = "isLoading";
        state.error = null;
      })
      .addCase(assignChat.fulfilled, (state, action) => {
        state.activeChatLoading = "succeeded";
        const updated = action.payload.data;
        state.chats = upsertChatInList(state.chats, updated);
        if (state.activeChat?._id === updated._id) {
          state.activeChat = { ...state.activeChat, ...updated };
        }
      })
      .addCase(assignChat.rejected, (state, action) => {
        state.activeChatLoading = "failed";
        state.error = action.payload?.message ?? "Failed to assign chat.";
      })

      // ===== deleteMessage =====
      .addCase(deleteMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload.data.messageId;
        state.messages = state.messages.map((m) =>
          m._id === messageId ? { ...m, isDeleted: true } : m,
        );
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.error = action.payload?.message ?? "Failed to delete message.";
      });
  },
});

export const { setActiveChat, clearMessages, clearChatError } =
  chatSlice.actions;

export default chatSlice.reducer;

