"use client";

import { MoreVertical, Search } from "lucide-react";
import type { CommunityChatGroup } from "@/types/community-chat-ui";
import { formatGroupStatus } from "@/lib/community-chat-ui";
import { CommunityGroupAvatar } from "@/components/dashboard/admin/community/CommunityGroupAvatar";

type Props = {
  group: CommunityChatGroup;
  onOpenGroupInfo: () => void;
};

export function CommunityChatHeader({ group, onOpenGroupInfo }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-t-xl bg-primary px-4 py-3 text-primary-foreground">
      <CommunityGroupAvatar
        name={group.name}
        profileImage={group.profileImage}
        className="size-11"
        variant="onBrand"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{group.name}</p>
        <p className="text-sm text-primary-foreground/90">
          {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
          {group.status ? (
            <span className="text-primary-foreground/80">
              {" "}
              · {formatGroupStatus(group.status)}
            </span>
          ) : null}
        </p>
      </div>
      <button
        type="button"
        className="rounded-lg p-2 hover:bg-primary-foreground/10"
        aria-label="Search in conversation"
      >
        <Search className="size-5 cursor-pointer" />
      </button>
      <button
        type="button"
        className="rounded-lg p-2 hover:bg-primary-foreground/10"
        aria-label="Open group menu"
        onClick={onOpenGroupInfo}
      >
        <MoreVertical className="size-5 cursor-pointer" />
      </button>
    </div>
  );
}
