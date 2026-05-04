"use client";

import { MoreVertical, Search, Users } from "lucide-react";
import type { CommunityChatGroup } from "@/data/community-chat-dummy";

type Props = {
  group: CommunityChatGroup;
  onOpenGroupInfo: () => void;
};

export function CommunityChatHeader({ group, onOpenGroupInfo }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-t-xl bg-[#0052CC] px-4 py-3 text-white">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[#0052CC]">
        <Users className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{group.name}</p>
        <p className="text-sm text-white/90">{group.memberCount} members</p>
      </div>
      <button
        type="button"
        className="rounded-lg p-2 hover:bg-white/10"
        aria-label="Search in conversation"
      >
        <Search className="size-5" />
      </button>
      <button
        type="button"
        className="rounded-lg p-2 hover:bg-white/10"
        aria-label="Open group menu"
        onClick={onOpenGroupInfo}
      >
        <MoreVertical className="size-5" />
      </button>
    </div>
  );
}
