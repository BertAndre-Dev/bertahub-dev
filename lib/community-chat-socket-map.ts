import type { GroupMessage } from "@/types/community-group";
import type { SocketMessageReceivedPayload } from "@/types/community-chat-socket";
import { normalizeAttachments } from "@/redux/slice/community-group/community-group-thunks";

/** Map WebSocket `message_received` payload to Redux `GroupMessage`. */
export function socketMessageToGroupMessage(
  payload: SocketMessageReceivedPayload,
): GroupMessage {
  return {
    _id: payload.messageId,
    groupId: payload.groupId,
    content: payload.content ?? "",
    messageType: payload.messageType ?? "text",
    senderId: payload.senderId,
    senderName: payload.senderName || "Someone",
    createdAt: payload.createdAt ?? new Date().toISOString(),
    attachments: normalizeAttachments(payload.attachments),
    replyTo: payload.replyTo,
    readBy: Array.isArray(payload.readBy) ? payload.readBy.map(String) : undefined,
  };
}
