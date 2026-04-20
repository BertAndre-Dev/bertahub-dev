export type ChatStatus = "active" | "closed" | "on_hold" | "archived";

export type UserRole =
  | "super-admin"
  | "admin"
  | "estate-admin"
  | "resident"
  | "security";

export interface ChatUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
}

export interface ChatMessage {
  _id: string;
  chatId: string;
  senderId: string | ChatUser;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  replyToMessageId?: string | ChatMessage;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Chat {
  _id: string;
  userId: string | ChatUser;
  supportAgentId?: string | ChatUser;
  subject: string;
  description?: string;
  estateId?: string;
  status: ChatStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ChatHistoryResponse {
  success: boolean;
  data: ChatMessage[];
  pagination: ChatPagination;
}

export interface ChatsListResponse {
  success: boolean;
  data: Chat[];
  pagination?: ChatPagination;
}

export interface CreateChatPayload {
  userId: string;
  supportAgentId?: string;
  subject: string;
  description?: string;
  estateId?: string;
}

export interface SendMessagePayload {
  chatId: string;
  content: string;
  fileData?: string;
  fileName?: string;
  fileMimeType?: string;
  replyToMessageId?: string;
}

export interface UpdateChatStatusPayload {
  chatId: string;
  status: ChatStatus;
  closureReason?: string;
}

export interface AssignChatPayload {
  chatId: string;
}

