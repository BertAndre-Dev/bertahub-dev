import type { ChatGroup } from "@/types/community-group";
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
    profileImage: g.profileImage,
    memberIds: Array.isArray(g.members) ? [...g.members] : undefined,
    adminIds: Array.isArray(g.admins) ? [...g.admins] : undefined,
  };
}
