"use client";

import type { CommunityMember } from "@/types/community-chat-ui";
import { cn } from "@/lib/utils";

type Props = {
  member: CommunityMember;
};

export function GroupMemberRow({ member }: Props) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 py-3 last:border-b-0">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
          member.avatarColor === "green" ? "bg-emerald-600" : "bg-gray-400",
        )}
        aria-hidden
      >
        {member.name
          .split(" ")
          .map((p) => p[0])
          .join("")
          .slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {member.subtitle}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
          member.tag === "Admin"
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
            : "bg-muted text-muted-foreground",
        )}
      >
        {member.tag}
      </span>
    </div>
  );
}
