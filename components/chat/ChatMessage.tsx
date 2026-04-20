"use client";

import { useCallback, useMemo } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import type { ChatMessage as ChatMessageType, ChatUser } from "@/types/chat";
import type { AppDispatch, RootState } from "@/redux/store";
import { deleteMessage } from "@/redux/slice/chat/chat-thunks";
import { useChatPermissions } from "@/hooks/useChatPermissions";

type Props = {
  message: ChatMessageType;
  currentUserId: string | null;
};

function getSenderId(senderId: string | ChatUser): string {
  if (typeof senderId === "string") return senderId;
  return senderId._id;
}

function getInitialsFromName(firstName?: string, lastName?: string): string {
  const f = (firstName ?? "").trim();
  const l = (lastName ?? "").trim();
  const initials = [f[0], l[0]].filter(Boolean).join("");
  return initials ? initials.toUpperCase() : "U";
}

function getInitialsFromEmail(email?: string): string {
  const e = (email ?? "").trim();
  if (!e) return "U";
  return e.slice(0, 1).toUpperCase();
}

function getSenderInitials(
  sender: string | ChatUser,
  fallback: { firstName?: string; lastName?: string; email?: string } | null,
): string {
  if (typeof sender !== "string") {
    const byName = getInitialsFromName(sender.firstName, sender.lastName);
    if (byName !== "U") return byName;
    return getInitialsFromEmail(sender.email);
  }
  const byName = getInitialsFromName(fallback?.firstName, fallback?.lastName);
  if (byName !== "U") return byName;
  return getInitialsFromEmail(fallback?.email);
}

export default function ChatMessage({ message, currentUserId }: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const { canDeleteMessage, role } = useChatPermissions();
  const currentUser = useSelector((state: RootState) => {
    const u = state.auth.user as unknown as
      | { _id?: string; id?: string; firstName?: string; lastName?: string; email?: string }
      | null;
    return u
      ? { id: u._id ?? u.id ?? null, firstName: u.firstName, lastName: u.lastName, email: u.email }
      : null;
  });

  const senderId = useMemo(
    () => getSenderId(message.senderId),
    [message.senderId],
  );
  const isMine = Boolean(currentUserId && senderId === currentUserId);

  const showInitials = useMemo(() => {
    return (
      role === "admin" ||
      role === "estate-admin" ||
      role === "resident" ||
      role === "security" ||
      role === "super-admin"
    );
  }, [role]);

  const initials = useMemo(() => {
    const fallback =
      isMine && currentUser
        ? { firstName: currentUser.firstName, lastName: currentUser.lastName, email: currentUser.email }
        : null;
    return getSenderInitials(message.senderId, fallback);
  }, [currentUser, isMine, message.senderId]);

  const handleDelete = useCallback(async () => {
    try {
      await dispatch(deleteMessage({ messageId: message._id })).unwrap();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to delete message.";
      toast.error(msg);
    }
  }, [dispatch, message._id]);

  const content = message.isDeleted ? (
    <span className="italic text-muted-foreground">This message was deleted</span>
  ) : (
    <span>{message.content}</span>
  );

  const attachment = useMemo(() => {
    if (message.isDeleted) return null;
    if (!message.fileUrl) return null;

    const url = message.fileUrl;
    const mime = (message.fileMimeType ?? "").toLowerCase();
    const name = message.fileName?.trim() || "Attachment";
    const isImage =
      mime.startsWith("image/") ||
      /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(url);

    if (isImage) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block"
          aria-label="Open image attachment"
          title="Open image"
        >
          {/* Use <img> to avoid Next remote image config */}
          <img
            src={url}
            alt={name}
            className="rounded-xl border border-black/10 max-h-64 w-auto"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </a>
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={[
          "mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
          isMine
            ? "border-white/20 hover:bg-white/10"
            : "border-border hover:bg-muted/50",
        ].join(" ")}
        aria-label="Open attachment"
        title="Open attachment"
      >
        <Paperclip className="h-4 w-4 shrink-0" />
        <span className="truncate max-w-[220px]">{name}</span>
      </a>
    );
  }, [isMine, message.fileMimeType, message.fileName, message.fileUrl, message.isDeleted]);

  return (
    <div className={["flex", isMine ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "flex items-end gap-2 max-w-[90%]",
          isMine ? "flex-row-reverse" : "flex-row",
        ].join(" ")}
      >
        {showInitials && (
          <div
            className={[
              "h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold border",
              isMine
                ? "bg-primary text-primary-foreground border-primary/20"
                : "bg-muted/60 text-foreground border-border",
            ].join(" ")}
            aria-label="Sender initials"
            title="Sender"
          >
            {initials}
          </div>
        )}

        <div
          className={[
            "group max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed border",
            isMine
              ? "bg-primary text-primary-foreground border-primary/20"
              : "bg-muted/40 text-foreground border-border",
          ].join(" ")}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">{content}</div>
            {canDeleteMessage && !message.isDeleted && (
              <button
                type="button"
                onClick={handleDelete}
                className={[
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "p-1 rounded-md",
                  isMine
                    ? "hover:bg-white/10 text-primary-foreground/90"
                    : "hover:bg-muted text-muted-foreground",
                ].join(" ")}
                aria-label="Delete message"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          {attachment}
          <div className="mt-2 text-[11px] opacity-80 text-right">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

