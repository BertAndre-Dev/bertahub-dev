import type { GroupMessage } from "@/types/community-group";
import type { CommunityMessage } from "@/types/community-chat-ui";
import { isSameUserId } from "@/lib/user-id";

function isoDateOnly(iso?: string): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function formatTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** Map API group message → UI bubble model. Outgoing messages use `type` `admin` for bubble layout (legacy). */
export function groupMessageToCommunity(
  m: GroupMessage,
  currentUserId: string | null,
  selfLabel = "You",
  messageById?: Map<string, GroupMessage>,
): CommunityMessage {
  const outgoing = isSameUserId(m.senderId, currentUserId);
  const isDeleted = Boolean(m.isDeleted);

  let text = (m.content ?? "").trim();
  if (isDeleted) {
    text = "This message was deleted.";
  } else if (!text && m.messageType && m.messageType !== "text") {
    text =
      m.messageType === "image"
        ? "[Image]"
        : m.messageType === "video"
          ? "[Video]"
          : m.messageType === "file"
            ? "[File]"
            : `[${m.messageType}]`;
  }
  const attachments = (m.attachments ?? []).filter((a) => a.url);
  const hasRenderableAttachments = attachments.length > 0;
  if (
    !isDeleted &&
    !text &&
    !hasRenderableAttachments &&
    (m.attachments?.length ?? 0) > 0
  ) {
    text = "[Attachment]";
  }
  if (!isDeleted && m.isEdited && text) {
    text = `${text} (edited)`;
  }

  let replyPreview: CommunityMessage["replyPreview"];
  if (m.replyTo && messageById) {
    const parent = messageById.get(m.replyTo);
    if (parent) {
      const parentDeleted = Boolean(parent.isDeleted);
      let parentText = (parent.content ?? "").trim();
      if (parentDeleted) {
        parentText = "This message was deleted.";
      } else if (!parentText && parent.messageType && parent.messageType !== "text") {
        parentText = "[Attachment]";
      }
      replyPreview = {
        id: parent._id,
        sender: parent.senderName || "Someone",
        text: parentText.slice(0, 160),
      };
    }
  }

  return {
    id: m._id,
    senderId: m.senderId,
    sender: outgoing ? selfLabel : m.senderName || "Someone",
    text,
    type: outgoing ? "admin" : "resident",
    time: formatTime(m.createdAt),
    date: isoDateOnly(m.createdAt),
    messageType: m.messageType,
    isDeleted,
    attachments: isDeleted
      ? undefined
      : hasRenderableAttachments
        ? attachments
        : undefined,
    replyPreview,
  };
}
