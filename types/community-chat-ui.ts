/** View models for Community Chat UI (mapped from API types in `community-group`). */

export type CommunityChatGroup = {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
  memberCount: number;
  createdAtLabel: string;
  about: string;
  status?: string;
  estateId?: string;
  createdBy?: string;
  profileImage?: string;
  memberIds?: string[];
  adminIds?: string[];
};

export type CommunityMessage = {
  id: string;
  sender: string;
  senderId?: string;
  text: string;
  /** `admin` = outgoing (current user); `resident` = others — legacy naming for bubble layout. */
  type: "admin" | "resident";
  time: string;
  date: string;
  messageType?: string;
  isDeleted?: boolean;
};

export type CommunityMember = {
  id: string;
  name: string;
  subtitle: string;
  tag: "Admin" | "Member";
  avatarColor: "green" | "gray";
};
