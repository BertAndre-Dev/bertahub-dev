"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RefreshCcw } from "lucide-react";

import type { AppDispatch, RootState } from "@/redux/store";
import type { Chat } from "@/types/chat";
import { useChatPermissions } from "@/hooks/useChatPermissions";
import ChatStatusBadge from "@/components/chat/ChatStatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import {
  getAgentChats,
  getChatById,
  getChatHistory,
  getUserChats,
} from "@/redux/slice/chat/chat-thunks";
import { clearMessages, setActiveChat } from "@/redux/slice/chat/chat-slice";

const HISTORY_LIMIT = 20;

function formatTime(val: string | undefined): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return val;
  }
}

export default function ChatSidebar() {
  const dispatch = useDispatch<AppDispatch>();
  const { canViewAgentChats } = useChatPermissions();

  const chats = useSelector((state: RootState) => state.chat.chats);
  const loading = useSelector((state: RootState) => state.chat.chatsLoading);
  const activeChatId = useSelector((state: RootState) => state.chat.activeChat?._id ?? null);

  const [assignedOnly, setAssignedOnly] = useState(true);

  const loadList = useCallback(async () => {
    try {
      if (canViewAgentChats) {
        await dispatch(getAgentChats({ assignedOnly })).unwrap();
      } else {
        await dispatch(getUserChats({})).unwrap();
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to load chats.";
      toast.error(msg);
    }
  }, [assignedOnly, canViewAgentChats, dispatch]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const handleSelect = useCallback(
    async (chat: Chat) => {
      try {
        dispatch(clearMessages());
        const res = await dispatch(getChatById({ chatId: chat._id })).unwrap();
        dispatch(setActiveChat(res.data));
        await dispatch(
          getChatHistory({ chatId: chat._id, page: 1, limit: HISTORY_LIMIT }),
        ).unwrap();
      } catch (err: unknown) {
        const msg =
          (err as { message?: string })?.message ?? "Failed to open chat.";
        toast.error(msg);
      }
    },
    [dispatch],
  );

  const list = useMemo(() => chats ?? [], [chats]);

  return (
    <Card className="h-full p-4 flex flex-col gap-4 mt-0">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading text-lg font-semibold">Chats</p>
          <p className="text-xs text-muted-foreground">
            {canViewAgentChats
              ? "Contact Support inbox"
              : "Your conversations"}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={loadList}
          disabled={loading === "isLoading"}
          aria-label="Refresh chats"
          title="Refresh"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {canViewAgentChats && (
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Assigned only</span>
          <input
            type="checkbox"
            checked={assignedOnly}
            onChange={(e) => setAssignedOnly(e.target.checked)}
            aria-label="Toggle assigned only"
          />
        </label>
      )}

      <div className="flex-1 overflow-auto space-y-2">
        {loading === "isLoading" && list.length === 0 && (
          <div className="py-10">
            <Loader label="Loading chats..." />
          </div>
        )}

        {loading !== "isLoading" && list.length === 0 && (
          <div className="text-sm text-muted-foreground py-6 text-center">
            No chats found.
          </div>
        )}

        {list.map((c) => {
          const isActive = activeChatId === c._id;
          return (
            <button
              key={c._id}
              type="button"
              onClick={() => void handleSelect(c)}
              className={[
                "w-full text-left rounded-xl border p-3 transition-colors",
                isActive ? "bg-primary/10 border-primary/20" : "hover:bg-muted/40",
              ].join(" ")}
              aria-label={`Open chat: ${c.subject}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm line-clamp-1">{c.subject}</p>
                <ChatStatusBadge status={c.status} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Updated: {formatTime(c.updatedAt ?? c.createdAt)}
              </p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

