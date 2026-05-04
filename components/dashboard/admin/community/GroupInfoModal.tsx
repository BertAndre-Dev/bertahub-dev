"use client";

import { ChevronRight, Pencil, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CommunityChatGroup,
  CommunityMember,
} from "@/data/community-chat-dummy";
import { GroupMemberRow } from "./GroupMemberRow";

type Props = {
  open: boolean;
  onClose: () => void;
  group: CommunityChatGroup;
  members: CommunityMember[];
  memberTotal?: number;
  onExitGroup?: () => void;
  onDeleteGroup?: () => void;
};

export function GroupInfoModal({
  open,
  onClose,
  group,
  members,
  memberTotal = 128,
  onExitGroup,
  onDeleteGroup,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card p-6 shadow-xl"
        role="dialog"
        aria-labelledby="group-info-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[#d0dff2] text-gray-700 transition-colors hover:bg-gray-200"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <h2 id="group-info-title" className="text-lg font-bold">
          Group Info
        </h2>

        <div className="mt-5 flex gap-3">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#0052CC] text-white">
            <Users className="size-8" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{group.name}</p>
            <p className="text-sm text-muted-foreground">
              {group.memberCount} members
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Created at {group.createdAtLabel}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 border-b border-border pb-4">
          <p className="flex-1 text-sm leading-relaxed text-foreground">
            {group.about}
          </p>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Edit description"
          >
            <Pencil className="size-4" />
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              Members ({memberTotal})
            </h3>
            <button
              type="button"
              className="text-sm font-medium text-[#0052CC] hover:underline"
            >
              + Add Members
            </button>
          </div>
          <div className="rounded-lg border border-border px-3">
            {members.map((m) => (
              <GroupMemberRow key={m.id} member={m} />
            ))}
          </div>
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all Members
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-lg border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC]/5"
            onClick={() => {
              onExitGroup?.();
              onClose();
            }}
          >
            Exit Group
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-lg border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => {
              onDeleteGroup?.();
              onClose();
            }}
          >
            Delete Group
          </Button>
        </div>
      </div>
    </div>
  );
}
