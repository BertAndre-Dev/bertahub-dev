"use client";

import { useEffect, useState } from "react";
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
  onDeleteGroup?: () => void | Promise<void>;
  onUpdateGroup?: (payload: {
    name: string;
    description: string;
  }) => void | Promise<void>;
  updateLoading?: boolean;
  detailLoading?: boolean;
};

export function GroupInfoModal({
  open,
  onClose,
  group,
  members,
  memberTotal = 128,
  onExitGroup,
  onDeleteGroup,
  onUpdateGroup,
  updateLoading = false,
  detailLoading = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editAbout, setEditAbout] = useState(group.about);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      return;
    }
    setEditName(group.name);
    setEditAbout(group.about);
  }, [open, group.name, group.about]);

  if (!open) return null;

  const showBusy = detailLoading || updateLoading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && !showBusy && onClose()}
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
          disabled={showBusy}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[#d0dff2] text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <h2 id="group-info-title" className="text-lg font-bold">
          Group Info
        </h2>

        {detailLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : null}

        <div className="mt-5 flex gap-3">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#0052CC] text-white">
            <Users className="size-8" />
          </div>
          <div className="min-w-0">
            {editing ? (
              <>
                <label className="sr-only" htmlFor="edit-group-name">
                  Group name
                </label>
                <input
                  id="edit-group-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm font-semibold"
                  disabled={showBusy}
                />
              </>
            ) : (
              <p className="font-semibold text-foreground">{group.name}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {group.memberCount} members
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Created at {group.createdAtLabel}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 border-b border-border pb-4">
          {editing ? (
            <textarea
              value={editAbout}
              onChange={(e) => setEditAbout(e.target.value)}
              className="min-h-[80px] flex-1 rounded-lg border border-border bg-background px-2 py-1 text-sm leading-relaxed"
              disabled={showBusy}
              aria-label="About this group"
            />
          ) : (
            <p className="flex-1 text-sm leading-relaxed text-foreground">
              {group.about}
            </p>
          )}
          <button
            type="button"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50"
            aria-label={editing ? "Cancel edit" : "Edit description"}
            disabled={showBusy}
            onClick={() => {
              if (editing) {
                setEditName(group.name);
                setEditAbout(group.about);
                setEditing(false);
              } else {
                setEditing(true);
              }
            }}
          >
            <Pencil className="size-4" />
          </button>
        </div>

        {editing ? (
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={showBusy}
              onClick={() => {
                setEditName(group.name);
                setEditAbout(group.about);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#0052CC] text-white hover:bg-[#0047B3]"
              disabled={showBusy || !editName.trim()}
              onClick={async () => {
                if (!onUpdateGroup || !editName.trim()) return;
                try {
                  await onUpdateGroup({
                    name: editName.trim(),
                    description: editAbout.trim(),
                  });
                  setEditing(false);
                } catch {
                  /* parent toast */
                }
              }}
            >
              {updateLoading ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : null}

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
            disabled={showBusy}
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
            disabled={showBusy}
            onClick={() => onDeleteGroup?.()}
          >
            Delete Group
          </Button>
        </div>
      </div>
    </div>
  );
}
