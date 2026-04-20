"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import type { AppDispatch, RootState } from "@/redux/store";
import { getChatHistory } from "@/redux/slice/chat/chat-thunks";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import { useChatPermissions } from "@/hooks/useChatPermissions";
import NewChatModal from "@/components/chat/NewChatModal";

const PAGE_LIMIT = 20;

function getCurrentUserId(state: RootState): string | null {
  const u = state.auth.user as unknown as { _id?: string; id?: string } | null;
  return u?._id ?? u?.id ?? null;
}

export default function ChatWindow() {
  const dispatch = useDispatch<AppDispatch>();
  const { canCreateChat } = useChatPermissions();

  const activeChat = useSelector((state: RootState) => state.chat.activeChat);
  const messages = useSelector((state: RootState) => state.chat.messages);
  const pag = useSelector((state: RootState) => state.chat.messagesPagination);
  const loading = useSelector((state: RootState) => state.chat.messagesLoading);
  const currentUserId = useSelector(getCurrentUserId);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef<number>(0);
  const [newChatOpen, setNewChatOpen] = useState(false);

  useEffect(() => {
    if (!activeChat?._id) return;
    dispatch(getChatHistory({ chatId: activeChat._id, page: 1, limit: PAGE_LIMIT }))
      .unwrap()
      .catch((err: unknown) => {
        const msg =
          (err as { message?: string })?.message ?? "Failed to load chat history.";
        toast.error(msg);
      });
  }, [activeChat?._id, dispatch]);

  const canLoadOlder = useMemo(() => {
    return Boolean(activeChat?._id && pag.page < pag.pages);
  }, [activeChat?._id, pag.page, pag.pages]);

  const chatEnded = useMemo(() => {
    return Boolean(activeChat?.status === "closed");
  }, [activeChat?.status]);

  const handleStartNewChat = useCallback(() => {
    setNewChatOpen(true);
  }, []);

  const handleCloseNewChat = useCallback(() => {
    setNewChatOpen(false);
  }, []);

  const handleLoadOlder = useCallback(async () => {
    if (!activeChat?._id) return;
    try {
      await dispatch(
        getChatHistory({
          chatId: activeChat._id,
          page: (pag.page ?? 1) + 1,
          limit: PAGE_LIMIT,
        }),
      ).unwrap();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to load older messages.";
      toast.error(msg);
    }
  }, [activeChat?._id, dispatch, pag.page]);

  useEffect(() => {
    const prev = prevMessageCountRef.current;
    const next = messages.length;
    prevMessageCountRef.current = next;

    // Scroll to bottom only when new messages are appended (not when prepending older history).
    if (next > prev) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  if (!activeChat) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div className="space-y-2">
          <p className="text-lg font-semibold">Select a conversation</p>
          <p className="text-sm text-muted-foreground">
            Choose a chat from the left to view messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background rounded-2xl border overflow-hidden">
      <ChatHeader chat={activeChat} />

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {loading === "isLoading" && messages.length === 0 && (
          <div className="py-10">
            <Loader label="Loading conversation..." />
          </div>
        )}

        {canLoadOlder && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleLoadOlder}
              disabled={loading === "isLoading"}
              aria-label="Load older messages"
            >
              {loading === "isLoading" ? "Loading..." : "Load older messages"}
            </Button>
          </div>
        )}

        {messages.map((m) => (
          <ChatMessage key={m._id} message={m} currentUserId={currentUserId} />
        ))}

        <div ref={bottomRef} />
      </div>

      {chatEnded ? (
        <div className="border-t bg-background p-4">
          <div className="rounded-2xl border bg-muted/30 p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium">You&apos;ve ended this chat.</p>
              <p className="text-sm text-muted-foreground mt-1">
                To continue, start a new chat conversation.
              </p>
            </div>
            {canCreateChat && (
              <Button
                type="button"
                onClick={handleStartNewChat}
                aria-label="Start new chat"
              >
                Start New Chat
              </Button>
            )}
          </div>

          <NewChatModal open={newChatOpen} onClose={handleCloseNewChat} />
        </div>
      ) : (
        <ChatInput chatId={activeChat._id} />
      )}
    </div>
  );
}

