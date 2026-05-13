/** Dummy data for admin Community Chat; list UI also maps live API groups. */

import type { ChatGroup } from "@/types/community-group";

export const COMMUNITY_ESTATE_NAME = "EZRA COURT";

export type CommunityChatGroup = {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
  memberCount: number;
  createdAtLabel: string;
  about: string;
  /** From API `status` (e.g. active). */
  status?: string;
  /** From GET group / list `estateId`. */
  estateId?: string;
  /** From GET group / list `createdBy` (creator user id). */
  createdBy?: string;
  /** Member user ids (same order as API `members`). */
  memberIds?: string[];
  /** Group admin user ids from API `admins`. */
  adminIds?: string[];
};

export type CommunityMessage = {
  id: string;
  sender: string;
  /** Present when mapped from API — for edit/delete own messages */
  senderId?: string;
  text: string;
  type: "admin" | "resident";
  time: string;
  /** ISO date string for grouping (dummy) */
  date: string;
  messageType?: string;
  /** Soft-deleted message from API */
  isDeleted?: boolean;
};

export type CommunityMember = {
  id: string;
  name: string;
  subtitle: string;
  tag: "Admin" | "Member";
  avatarColor: "green" | "gray";
};

export const DUMMY_GROUPS: CommunityChatGroup[] = [
  {
    id: "g1",
    name: "Demo Estate Residents",
    lastMsg: "You: Good morning everyone...",
    time: "10:30 AM",
    unread: 12,
    memberCount: 156,
    createdAtLabel: "May 10, 2024 at 11:45 AM",
    about: "This group is for all residents of Demo Estate",
  },
  {
    id: "g2",
    name: "Block A Residents",
    lastMsg: "Dunsin: Thanks for the update on water supply.",
    time: "09:15 AM",
    unread: 3,
    memberCount: 42,
    createdAtLabel: "April 2, 2024 at 08:20 AM",
    about: "Announcements and chat for Block A only.",
  },
  {
    id: "g3",
    name: "Facility Notices",
    lastMsg: "You: Gate hours change this weekend.",
    time: "Yesterday",
    unread: 0,
    memberCount: 280,
    createdAtLabel: "Jan 15, 2024 at 02:00 PM",
    about: "Official notices from facility management.",
  },
];

export const DUMMY_MESSAGES_BY_GROUP: Record<string, CommunityMessage[]> = {
  g1: [
    {
      id: "m3",
      sender: "Chioma Okafor",
      text: "Good afternoon — any update on the generator maintenance?",
      type: "resident",
      time: "02:10 PM",
      date: "2026-05-02",
    },
    {
      id: "m1",
      sender: "Farouq Bolade",
      text: "Hello, facility manager",
      type: "resident",
      time: "03:53 PM",
      date: "2026-05-02",
    },
    {
      id: "m2",
      sender: "You (Facility Manager)",
      text: "Hello, all, welcome to the resident groupchat",
      type: "admin",
      time: "03:53 PM",
      date: "2026-05-02",
    },
  ],
  g2: [
    {
      id: "m4",
      sender: "Dunsin Ade",
      text: "Thanks for the update on water supply.",
      type: "resident",
      time: "09:12 AM",
      date: "2026-05-02",
    },
  ],
  g3: [
    {
      id: "m5",
      sender: "You (Facility Manager)",
      text: "Gate hours change this weekend — please read the notice pinned above.",
      type: "admin",
      time: "08:00 AM",
      date: "2026-05-01",
    },
  ],
};

export const DUMMY_GROUP_MEMBERS: CommunityMember[] = [
  {
    id: "u1",
    name: "John Adeyemi",
    subtitle: "Facility Manager",
    tag: "Admin",
    avatarColor: "green",
  },
  {
    id: "u2",
    name: "Farouq Bolade",
    subtitle: "Resident",
    tag: "Member",
    avatarColor: "gray",
  },
  {
    id: "u3",
    name: "Chioma Okafor",
    subtitle: "Resident",
    tag: "Member",
    avatarColor: "green",
  },
  {
    id: "u4",
    name: "Emeka Nwosu",
    subtitle: "Resident",
    tag: "Member",
    avatarColor: "gray",
  },
];

export const DUMMY_RESIDENT_OPTIONS = [
  { label: "Select residents", value: "" },
  { label: "Block A — floor 1", value: "block-a-1" },
  { label: "Block A — floor 2", value: "block-a-2" },
  { label: "Block B — all", value: "block-b" },
];

function formatGroupTime(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    if (d >= startOfToday) {
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    if (d >= startOfYesterday && d < startOfToday) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function formatCreatedAtLabel(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** Human-readable group status from API (e.g. `active` → Active). */
export function formatGroupStatus(status?: string): string {
  if (!status?.trim()) return "";
  const s = status.trim().toLowerCase().replaceAll("_", " ");
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortenUserId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

/**
 * Build member rows for the group info modal from API `members` / `admins` ids
 * (GET group / GET groups shape).
 */
export function chatGroupMemberRowsFromApi(
  group: CommunityChatGroup,
): CommunityMember[] {
  const ids = group.memberIds ?? [];
  const adminSet = new Set(group.adminIds ?? []);
  return ids.map((userId) => ({
    id: userId,
    name: shortenUserId(userId),
    subtitle: adminSet.has(userId) ? "Group admin" : "Member",
    tag: adminSet.has(userId) ? "Admin" : "Member",
    avatarColor: adminSet.has(userId) ? "green" : "gray",
  }));
}

/** Map a chat group from the API to sidebar / window display model. */
export function chatGroupToCommunity(g: ChatGroup): CommunityChatGroup {
  const about = (g.description ?? "").trim() || "No description yet.";
  const memberCount =
    typeof g.memberCount === "number" && g.memberCount > 0
      ? g.memberCount
      : Array.isArray(g.members)
        ? g.members.length
        : 0;
  const preview = (g.lastMessagePreview ?? "").trim();
  const desc = (g.description ?? "").trim();
  const statusLabel = formatGroupStatus(g.status);

  let lastMsg = preview;
  if (!lastMsg) {
    if (desc) {
      lastMsg = desc.length > 56 ? `${desc.slice(0, 56)}…` : desc;
    } else {
      lastMsg = `${memberCount} member${memberCount === 1 ? "" : "s"}`;
      if (statusLabel) lastMsg += ` · ${statusLabel}`;
    }
  }

  return {
    id: g._id,
    name: g.name,
    lastMsg,
    time: formatGroupTime(g.updatedAt ?? g.createdAt),
    unread: g.unreadCount ?? 0,
    memberCount,
    createdAtLabel: formatCreatedAtLabel(g.createdAt),
    about,
    status: g.status,
    estateId: g.estateId,
    createdBy: g.createdBy,
    memberIds: Array.isArray(g.members) ? [...g.members] : undefined,
    adminIds: Array.isArray(g.admins) ? [...g.admins] : undefined,
  };
}
