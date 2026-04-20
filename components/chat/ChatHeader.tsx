"use client";

import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { UserPlus, XCircle } from "lucide-react";

import type { AppDispatch, RootState } from "@/redux/store";
import type { Chat } from "@/types/chat";
import { useChatPermissions } from "@/hooks/useChatPermissions";
import ChatStatusBadge from "@/components/chat/ChatStatusBadge";
import { Button } from "@/components/ui/button";
import { assignChat, closeChat } from "@/redux/slice/chat/chat-thunks";

type Props = {
  chat: Chat;
};

export default function ChatHeader({ chat }: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const { canAssignAgent, canCloseChat } = useChatPermissions();
  const activeChatLoading = useSelector(
    (state: RootState) => state.chat.activeChatLoading,
  );

  const isBusy = activeChatLoading === "isLoading";
  const canClose = useMemo(
    () => canCloseChat && chat.status !== "closed",
    [canCloseChat, chat.status],
  );

  const handleClose = useCallback(async () => {
    try {
      await dispatch(closeChat({ chatId: chat._id })).unwrap();
      toast.success("Chat closed.");
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to close chat.";
      toast.error(msg);
    }
  }, [dispatch, chat._id]);

  const handleAssign = useCallback(async () => {
    try {
      await dispatch(assignChat({ chatId: chat._id })).unwrap();
      toast.success("Chat assigned.");
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to assign chat.";
      toast.error(msg);
    }
  }, [dispatch, chat._id]);

  return (
    <div className="border-b bg-background p-4 flex items-center justify-between gap-4">
      {/* Subject + status */}
      <div className="min-w-0 flex-1">
        <h2 className="font-heading text-lg font-semibold truncate">
          {chat.subject}
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <ChatStatusBadge status={chat.status} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {canAssignAgent && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleAssign()}
            disabled={isBusy}
            aria-label="Assign chat"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isBusy ? "Assigning..." : "Assign"}
          </Button>
        )}
        {canClose && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleClose}
            disabled={isBusy}
            aria-label="Close chat"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Close
          </Button>
        )}

        {canClose && (
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            aria-label="End chat"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <XCircle className="h-4 w-4" />
            End Chat
          </button>
        )}
      </div>
    </div>
  );
}
