/**
 * Map backend notification actionUrl values to in-app dashboard routes.
 */

const ROLE_BASE: Record<string, string> = {
  admin: "/dashboard/admin",
  "estate admin": "/dashboard/estate-admin",
  "super admin": "/dashboard/super-admin",
  resident: "/dashboard/resident",
  staff: "/dashboard/staff",
  company: "/dashboard/company",
  security: "/dashboard/security",
  "energy provider": "/dashboard/energy-provider",
};

const ROLES_WITH_REQUEST_PAGE = new Set([
  "admin",
  "estate admin",
  "staff",
  "company",
]);

function normalizeRole(role: string): string {
  return role.toLowerCase().trim();
}

function roleDashboardBase(role: string): string {
  return ROLE_BASE[normalizeRole(role)] ?? "/dashboard/admin";
}

/** Full inbox page path for the signed-in role. */
export function getNotificationsInboxPath(
  role: string | null | undefined,
): string {
  return `${roleDashboardBase(role || "admin")}/notifications`;
}

/** Decode common HTML entities from API notification copy (e.g. `&quot;`). */
export function decodeNotificationText(value: string): string {
  if (!value || !/[&][#a-zA-Z0-9]+;/.test(value)) return value;
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Backend actionUrl path segments → real App Router segments. */
const ACTION_PATH_ALIASES: Record<string, string> = {
  meters: "meter",
  meter: "meter",
  bills: "bills",
  bill: "bills",
  visitors: "visitor",
  visitor: "visitor",
  complaints: "maintenance",
  complaint: "maintenance",
  maintenance: "maintenance",
  wallet: "transaction",
  transactions: "transaction",
  transaction: "transaction",
  announcements: "announcements",
  marketplace: "marketplace",
  notifications: "notifications",
  rent: "rent",
  "pay-bills": "pay-bills",
  community: "community",
  requests: "request",
  request: "request",
};

function complaintHref(role: string, complaintId: string): string {
  const normalized = normalizeRole(role);
  if (normalized === "resident") {
    return `/dashboard/resident/maintenance?id=${complaintId}`;
  }
  if (normalized === "staff") {
    return `/dashboard/staff/maintenance?id=${complaintId}`;
  }
  return `${roleDashboardBase(role)}/maintenance?id=${complaintId}`;
}

/** Backend `/requests/{id}` → role request page with detail query. */
function requestHref(
  role: string,
  requestId: string,
  estateId?: string,
): string {
  const normalized = normalizeRole(role);
  if (!ROLES_WITH_REQUEST_PAGE.has(normalized)) {
    return getNotificationsInboxPath(role);
  }

  const params = new URLSearchParams();
  params.set("id", requestId);
  if (estateId?.trim()) params.set("estateId", estateId.trim());
  return `${roleDashboardBase(role)}/request?${params.toString()}`;
}

/** Backend `/chat/{groupId}` → role community inbox (group chat). */
function communityChatHref(role: string, groupId?: string): string {
  const normalized = normalizeRole(role);
  const base = roleDashboardBase(role);
  const rolesWithCommunity = new Set(["admin", "resident", "staff"]);

  if (rolesWithCommunity.has(normalized)) {
    if (groupId?.trim()) {
      return `${base}/community?groupId=${encodeURIComponent(groupId.trim())}`;
    }
    return `${base}/community`;
  }

  // Estate-admin has support chat, not community groups.
  if (normalized === "estate admin") {
    return `${base}/chat`;
  }

  return getNotificationsInboxPath(role);
}

function mapActionPath(pathname: string): string {
  const clean = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!clean) return "";

  const [first, ...rest] = clean.split("/");
  const mappedFirst = ACTION_PATH_ALIASES[first.toLowerCase()] ?? first;
  return [mappedFirst, ...rest].filter(Boolean).join("/");
}

export type ResolveNotificationHrefOptions = {
  estateId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
};

export function resolveNotificationHref(
  actionUrl: string | undefined,
  role: string,
  options?: ResolveNotificationHrefOptions,
): string | null {
  const estateId = options?.estateId?.trim();
  const relatedId = options?.relatedEntityId?.trim();
  const relatedType = options?.relatedEntityType?.trim().toLowerCase();

  const url = actionUrl?.trim();

  if (!url) {
    if (
      relatedId &&
      (relatedType === "estate_request" || relatedType === "request")
    ) {
      return requestHref(role, relatedId, estateId);
    }
    return null;
  }

  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/dashboard")) return url;

  const complaintMatch = /^\/complaints\/([^/?#]+)/i.exec(url);
  if (complaintMatch?.[1]) {
    return complaintHref(role, complaintMatch[1]);
  }

  const requestMatch = /^\/requests?\/([^/?#]+)/i.exec(url);
  if (requestMatch?.[1]) {
    return requestHref(role, requestMatch[1], estateId);
  }

  const chatMatch = /^\/chat(?:\/([^/?#]+))?\/?(?:[?#].*)?$/i.exec(url);
  if (chatMatch) {
    return communityChatHref(role, chatMatch[1]);
  }

  const qIndex = url.indexOf("?");
  const pathPart = qIndex >= 0 ? url.slice(0, qIndex) : url;
  const queryPart = qIndex >= 0 ? url.slice(qIndex) : "";

  const mapped = mapActionPath(
    pathPart.startsWith("/") ? pathPart : `/${pathPart}`,
  );

  // `/request/{id}` mapped path → query-style detail open
  const mappedRequestMatch = /^request\/([^/?#]+)$/i.exec(mapped);
  if (mappedRequestMatch?.[1]) {
    return requestHref(role, mappedRequestMatch[1], estateId);
  }

  const base = roleDashboardBase(role);
  return `${base}/${mapped}${queryPart}`;
}

export function formatNotificationTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
