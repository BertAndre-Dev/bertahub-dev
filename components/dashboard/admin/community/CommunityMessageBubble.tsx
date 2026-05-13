"use client";

import { CheckCheck, Pencil, Trash2 } from "lucide-react";
import type { CommunityMessage } from "@/types/community-chat-ui";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  message: CommunityMessage;
  currentUserId?: string | null;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  messageActionsDisabled?: boolean;
}>;

export function CommunityMessageBubble({
  message,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
  messageActionsDisabled,
}: Props) {
  const isAdmin = message.type === "admin";
  const isMine =
    Boolean(currentUserId) &&
    Boolean(message.senderId) &&
    message.senderId === currentUserId;
  const deleted = Boolean(message.isDeleted);
  const canEditText =
    !deleted && (!message.messageType || message.messageType === "text");
  const showEdit = isMine && onEditMessage && canEditText;
  const showDelete = isMine && onDeleteMessage && !deleted;

  return (
    <div
      className={cn(
        "flex gap-2",
        isAdmin ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "mt-5 size-8 shrink-0 rounded-full",
          isAdmin ? "bg-emerald-600" : "bg-[#0052CC]/25",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "flex max-w-[min(100%,28rem)] min-w-0 flex-col",
          isAdmin ? "items-end text-right" : "items-start text-left",
        )}
      >
        <p
          className={cn(
            "mb-1 text-xs font-semibold",
            isAdmin ? "text-emerald-700" : "text-foreground",
          )}
        >
          {message.sender}
        </p>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm shadow-sm",
            isAdmin
              ? "rounded-tr-sm bg-emerald-50 text-foreground dark:bg-emerald-950/40"
              : "rounded-tl-sm bg-muted text-foreground",
            deleted && "opacity-80",
          )}
        >
          <p
            className={cn(
              "whitespace-pre-wrap break-words",
              deleted && "italic text-muted-foreground",
            )}
          >
            {message.text}
          </p>
          <div
            className={cn(
              "mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground",
              isAdmin ? "justify-end" : "justify-start",
            )}
          >
            <span>{message.time}</span>
            {isAdmin && (
              <CheckCheck className="size-3.5 text-emerald-600" aria-hidden />
            )}
            {showEdit || showDelete ? (
              <span className="inline-flex gap-0.5">
                {showEdit ? (
                  <button
                    type="button"
                    disabled={messageActionsDisabled}
                    className="rounded p-0.5 hover:bg-background/80 disabled:opacity-40"
                    aria-label="Edit message"
                    onClick={() => onEditMessage?.(message.id)}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                ) : null}
                {showDelete ? (
                  <button
                    type="button"
                    disabled={messageActionsDisabled}
                    className="rounded p-0.5 hover:bg-background/80 text-destructive disabled:opacity-40"
                    aria-label="Delete message"
                    onClick={() => onDeleteMessage?.(message.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
