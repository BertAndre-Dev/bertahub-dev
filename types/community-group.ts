/** Estate community group chat (REST: /api/v1/chat/groups). */

/** Populated member row from list/detail API (or legacy string id only). */
export interface ChatGroupMemberUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChatGroup {
  _id: string;
  name: string;
  description?: string;
  profileImage?: string;
  estateId?: string;
  createdBy?: string;
  members?: ChatGroupMemberUser[];
  /** Admin user ids (extracted from API string or object entries). */
  admins?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  memberCount?: number;
  unreadCount?: number;
  lastMessagePreview?: string;
}

export interface ChatGroupsListResponse {
  success: boolean;
  data: ChatGroup[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateChatGroupPayload {
  name: string;
  description?: string;
  profileImage?: string;
}

export interface UpdateChatGroupPayload {
  groupId: string;
  name?: string;
  description?: string;
  profileImage?: string;
}

export type ChatGroupRoleToAdd =
  | "RESIDENT"
  | "ADMIN"
  | "SECURITY"
  | "ESTATE_ADMIN";

export interface AddGroupMembersPayload {
  groupId: string;
  memberIds?: string[];
  addAllSameRole?: boolean;
  roleToAdd?: ChatGroupRoleToAdd;
}

export interface RemoveGroupMembersPayload {
  groupId: string;
  memberIds: string[];
}

export interface PromoteGroupAdminPayload {
  groupId: string;
  userId: string;
}

export type GroupMessageType = "text" | "image" | "video" | "file" | string;

/** Attachment object from list/send API; legacy responses may use plain URL strings. */
export interface GroupMessageAttachment {
  url: string;
  type?: string;
  mimeType?: string;
  fileName?: string;
}

export interface GroupMessage {
  _id: string;
  groupId?: string;
  content: string;
  messageType: GroupMessageType;
  senderId: string;
  senderName: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: GroupMessageAttachment[];
  replyTo?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  readBy?: string[];
}

export interface GroupMessagesListResponse {
  success: boolean;
  data: GroupMessage[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SendGroupMessagePayload {
  groupId: string;
  content: string;
  messageType?: GroupMessageType;
  attachments?: string[];
  replyTo?: string;
}

export interface ReplyToGroupMessagePayload {
  groupId: string;
  messageId: string;
  content: string;
  messageType?: GroupMessageType;
  attachments?: string[];
}

export interface EditGroupMessagePayload {
  messageId: string;
  content: string;
}
