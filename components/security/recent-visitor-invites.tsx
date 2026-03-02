"use client";

import { Info } from "lucide-react";
import type { SecurityVisitorItem } from "@/redux/slice/security/visitor/visitor-slice";

function getAddressDisplay(addressId: SecurityVisitorItem["addressId"]) {
  if (!addressId?.data) return "";
  const parts = Object.values(addressId.data).filter(Boolean);
  return parts.length ? parts.join(", ") : "";
}

function getTimeAgo(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  return "Just now";
}

interface RecentVisitorInvitesProps {
  visitors: SecurityVisitorItem[];
  loading?: boolean;
  maxItems?: number;
}

export default function RecentVisitorInvites({
  visitors,
  loading = false,
  maxItems = 6,
}: RecentVisitorInvitesProps) {
  // const list = visitors?.slice(0, maxItems) ?? [];
  const list = (Array.isArray(visitors) ? visitors : []).slice(0, maxItems);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-lg font-semibold mb-4">Recent Visitor Invites</h3>
        <p className="text-sm text-muted-foreground py-6 text-center">
          Loading...
        </p>
      </div>
    );
  }

  if (!list.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-lg font-semibold mb-4">Recent Visitor Invites</h3>
        <p className="text-sm text-muted-foreground py-6 text-center">
          No recent invites
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-lg font-semibold mb-4">Recent Visitor Invites</h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {list.map((invite) => {
          const residentName = invite.residentId
            ? `${invite.residentId.firstName} ${invite.residentId.lastName}`
            : "—";
          const address = getAddressDisplay(invite.addressId);
          const visitorName = `${invite.firstName} ${invite.lastName}`;
          const purpose = invite.purpose ?? "—";

          return (
            <div
              key={invite.id}
              className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5"
            >
              <p className="font-semibold text-foreground text-sm">
                {residentName}
                {address ? `; ${address}` : ""}
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Info className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span>
                  Invited : {visitorName} | {purpose} | 1
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {getTimeAgo(invite.createdAt)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
