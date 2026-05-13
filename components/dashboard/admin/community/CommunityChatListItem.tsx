"use client";

import type { CommunityChatGroup } from "@/types/community-chat-ui";
import { CommunityGroupAvatar } from "@/components/dashboard/admin/community/CommunityGroupAvatar";
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
        "flex w-full gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors last:border-b-0 cursor-pointer",
        active ? "bg-primary/10" : "hover:bg-muted/50",
      )}
    >
      <CommunityGroupAvatar
        name={group.name}
        profileImage={group.profileImage}
        className="size-11 cursor-pointer"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 cursor-pointer">
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
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {group.unread > 99 ? "99+" : group.unread}
        </span>
      )}
    </button>
  );
}
