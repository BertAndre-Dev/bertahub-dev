/** Server → client payloads for community group chat (/api/v1/chat). */

export type SocketMessageType = "text" | "image" | "video" | "file" | string;

export interface SocketMessageReceivedPayload {
  messageId: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: SocketMessageType;
  attachments?: unknown[];
  readBy?: string[];
  replyTo?: string;
  createdAt: string;
}

export interface SocketMessageEditedPayload {
  messageId: string;
  groupId: string;
  content: string;
  editedAt?: string;
}

export interface SocketMessageDeletedPayload {
  messageId: string;
  groupId: string;
}

export interface SocketMessagesReadPayload {
  userId: string;
  groupId: string;
  messageIds: string[];
  timestamp?: string;
}

export interface SocketGroupAddedPayload {
  groupId: string;
  name: string;
  description?: string;
  profileImage?: string;
}

export interface SocketGroupRemovedPayload {
  groupId: string;
  name?: string;
}

export interface SocketGroupUpdatedPayload {
  groupId: string;
  name?: string;
  description?: string;
  profileImage?: string;
  updatedAt?: string;
}

export interface SocketGroupDeletedPayload {
  groupId: string;
  timestamp?: string;
}

export interface SocketMemberEventPayload {
  groupId: string;
  userId: string;
  userName?: string;
  timestamp?: string;
}

export interface SocketUserTypingPayload {
  userId: string;
  userName?: string;
  groupId: string;
  isTyping: boolean;
  timestamp?: string;
}
