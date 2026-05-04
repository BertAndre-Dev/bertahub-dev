"use client";

import { Users } from "lucide-react";
import type { CommunityChatGroup } from "@/data/community-chat-dummy";
import { cn } from "@/lib/utils";

type Props = {
  group: CommunityChatGroup;
  active: boolean;
  onSelect: () => void;
};

export function CommunityChatListItem({
  group,
  active,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors last:border-b-0",
        active ? "bg-[#0052CC]/10" : "hover:bg-muted/50",
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#0052CC] text-white">
        <Users className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold text-foreground">{group.name}</p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {group.time}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {group.lastMsg}
        </p>
      </div>
      {group.unread > 0 && (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0052CC] text-[11px] font-semibold text-white">
          {group.unread > 99 ? "99+" : group.unread}
        </span>
      )}
    </button>
  );
}
