import type { ChatGroup, ChatGroupMemberUser } from "@/types/community-group";
import type { CommunityChatGroup, CommunityMember } from "@/types/community-chat-ui";

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

/** Short display for a user id when we have no name (API may send non-string in edge cases). */
function shortenUserId(id: unknown): string {
  const s =
    typeof id === "string"
      ? id.trim()
      : id != null && id !== ""
        ? String(id).trim()
        : "";
  if (!s) return "—";
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

function memberDisplayName(m: ChatGroupMemberUser): string {
  const combined = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  if (m.email?.trim()) return m.email.trim();
  return shortenUserId(m.id);
}

/**
 * Build member rows for the group info modal from API `members` / `admins`
 * (string ids, or populated user objects normalized in Redux).
 */
export function chatGroupMemberRowsFromApi(
  group: CommunityChatGroup,
): CommunityMember[] {
  const adminSet = new Set(group.adminIds ?? []);

  if (group.memberUsers && group.memberUsers.length > 0) {
    return group.memberUsers.map((m) => ({
      id: m.id,
      name: memberDisplayName(m),
      subtitle: adminSet.has(m.id) ? "Group admin" : "Member",
      tag: adminSet.has(m.id) ? "Admin" : "Member",
      avatarColor: adminSet.has(m.id) ? "green" : "gray",
    }));
  }

  const ids = group.memberIds ?? [];
  return ids.map((rawId) => {
    const id =
      typeof rawId === "string"
        ? rawId.trim()
        : String(rawId ?? "").trim() || "—";
    return {
      id,
      name: shortenUserId(id),
      subtitle: adminSet.has(id) ? "Group admin" : "Member",
      tag: adminSet.has(id) ? "Admin" : "Member",
      avatarColor: adminSet.has(id) ? "green" : "gray",
    };
  });
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

  const memberUsers =
    g.members && g.members.length > 0 ? [...g.members] : undefined;
  const memberIds =
    memberUsers?.map((m) => m.id) ??
    undefined;

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
    profileImage: g.profileImage,
    memberUsers,
    memberIds,
    adminIds: Array.isArray(g.admins) ? [...g.admins] : undefined,
  };
}
