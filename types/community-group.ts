/** Estate community group chat (REST: /api/v1/chat/groups). */

export interface ChatGroup {
  _id: string;
  name: string;
  description?: string;
  profileImage?: string;
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
