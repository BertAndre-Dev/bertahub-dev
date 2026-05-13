import type { GroupMessage } from "@/types/community-group";
import type { CommunityMessage } from "@/types/community-chat-ui";

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
): CommunityMessage {
  const outgoing =
    Boolean(currentUserId) &&
    Boolean(m.senderId) &&
    m.senderId === currentUserId;
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
  if (!isDeleted && m.attachments?.length && !text) text = "[Attachment]";
  if (!isDeleted && m.isEdited && text) {
    text = `${text} (edited)`;
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
  };
}
