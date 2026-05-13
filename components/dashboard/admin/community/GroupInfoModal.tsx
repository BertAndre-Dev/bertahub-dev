"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type {
  CommunityChatGroup,
  CommunityMember,
} from "@/types/community-chat-ui";
import { formatGroupStatus } from "@/lib/community-chat-ui";
import type { ChatGroupRoleToAdd } from "@/types/community-group";
import { GroupMemberRow } from "./GroupMemberRow";
import { CommunityGroupAvatar } from "./CommunityGroupAvatar";

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function parseObjectIds(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((id) => OBJECT_ID_RE.test(id));
}

const ROLE_OPTIONS: { label: string; value: ChatGroupRoleToAdd }[] = [
  { label: "Residents", value: "RESIDENT" },
  { label: "Admins", value: "ADMIN" },
  { label: "Security", value: "SECURITY" },
  { label: "Estate admins", value: "ESTATE_ADMIN" },
];

type Props = Readonly<{
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
  /** Show add/remove members and promote (group admins). */
  showMemberAdminTools?: boolean;
  /** Allow editing group name / description (estate admins). */
  canUpdateGroupProfile?: boolean;
  /** Show delete group (creator). */
  canDeleteGroup?: boolean;
  membersActionLoading?: boolean;
  onAddMembersByIds?: (memberIds: string[]) => void | Promise<void>;
  onAddAllSameRole?: (roleToAdd: ChatGroupRoleToAdd) => void | Promise<void>;
  onRemoveMembersByIds?: (memberIds: string[]) => void | Promise<void>;
  onPromoteMember?: (userId: string) => void | Promise<void>;
  /** Friendly estate name from signed-in user (replaces showing raw id only). */
  estateDisplayName?: string | null;
}>;

export function GroupInfoModal({
  open,
  onClose,
  group,
  members,
  memberTotal,
  onExitGroup,
  onDeleteGroup,
  onUpdateGroup,
  updateLoading = false,
  detailLoading = false,
  showMemberAdminTools = false,
  canUpdateGroupProfile = true,
  canDeleteGroup = true,
  membersActionLoading = false,
  onAddMembersByIds,
  onAddAllSameRole,
  onRemoveMembersByIds,
  onPromoteMember,
  estateDisplayName,
}: Props) {
  const [editing, setEditing] = useState(false);
  const resolvedMemberTotal =
    memberTotal ?? group.memberCount ?? members.length;
  const [editName, setEditName] = useState(group.name);
  const [editAbout, setEditAbout] = useState(group.about);
  const [addIdsRaw, setAddIdsRaw] = useState("");
  const [removeIdsRaw, setRemoveIdsRaw] = useState("");
  const [promoteUserId, setPromoteUserId] = useState("");
  const [roleToAdd, setRoleToAdd] = useState<ChatGroupRoleToAdd>("RESIDENT");

  useEffect(() => {
    if (!open) {
      setEditing(false);
      return;
    }
    setEditName(group.name);
    setEditAbout(group.about);
    setAddIdsRaw("");
    setRemoveIdsRaw("");
    setPromoteUserId("");
  }, [open, group.name, group.about]);

  if (!open) return null;

  const showBusy =
    detailLoading || updateLoading || membersActionLoading;

  const trimmedEstateName = (estateDisplayName ?? "").trim();
  let estateMetaBlock: JSX.Element | null = null;
  if (trimmedEstateName) {
    estateMetaBlock = (
      <p className="mt-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Estate: </span>
        <span>{trimmedEstateName}</span>
      </p>
    );
  } else if (group.estateId) {
    estateMetaBlock = (
      <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-sans text-xs font-medium text-muted-foreground">
          Estate ID:{" "}
        </span>
        {group.estateId}
      </p>
    );
  }

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
          <CommunityGroupAvatar
            name={group.name}
            profileImage={group.profileImage}
            className="size-16"
            iconClassName="size-8"
          />
          <div className="min-w-0">
            {editing && canUpdateGroupProfile ? (
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
            {group.status ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Status:{" "}
                <span className="font-medium text-foreground">
                  {formatGroupStatus(group.status)}
                </span>
              </p>
            ) : null}
            {estateMetaBlock}
            {group.createdBy ? (
              <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-sans text-xs font-medium text-muted-foreground">
                  Created by:{" "}
                </span>
                {group.createdBy}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 border-b border-border pb-4">
          {editing && canUpdateGroupProfile ? (
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
          {canUpdateGroupProfile ? (
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
          ) : null}
        </div>

        {editing && canUpdateGroupProfile ? (
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

        {showMemberAdminTools ? (
          <div className="mt-6 space-y-4 rounded-lg border border-border bg-muted/20 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Manage members
            </h3>
            <div>
              <Label htmlFor="add-member-ids">Add by user IDs</Label>
              <Textarea
                id="add-member-ids"
                value={addIdsRaw}
                onChange={(e) => setAddIdsRaw(e.target.value)}
                placeholder="Comma or space separated MongoDB user IDs"
                className="mt-1 min-h-[72px] text-xs font-mono"
                disabled={showBusy}
              />
              <Button
                type="button"
                size="sm"
                className="mt-2"
                disabled={showBusy || parseObjectIds(addIdsRaw).length === 0}
                onClick={() =>
                  onAddMembersByIds?.(parseObjectIds(addIdsRaw))
                }
              >
                Add members
              </Button>
            </div>
            <div>
              <Label htmlFor="add-all-role">Add all active users by role</Label>
              <Select
                id="add-all-role"
                value={roleToAdd}
                onChange={(e) =>
                  setRoleToAdd(e.target.value as ChatGroupRoleToAdd)
                }
                options={ROLE_OPTIONS}
                className="mt-1 h-10"
                disabled={showBusy}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-2"
                disabled={showBusy}
                onClick={() => onAddAllSameRole?.(roleToAdd)}
              >
                Add all with this role
              </Button>
            </div>
            <div>
              <Label htmlFor="remove-member-ids">Remove by user IDs</Label>
              <Textarea
                id="remove-member-ids"
                value={removeIdsRaw}
                onChange={(e) => setRemoveIdsRaw(e.target.value)}
                placeholder="Comma or space separated user IDs"
                className="mt-1 min-h-[72px] text-xs font-mono"
                disabled={showBusy}
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="mt-2"
                disabled={showBusy || parseObjectIds(removeIdsRaw).length === 0}
                onClick={() =>
                  onRemoveMembersByIds?.(parseObjectIds(removeIdsRaw))
                }
              >
                Remove members
              </Button>
            </div>
            <div>
              <Label htmlFor="promote-user-id">Promote to group admin</Label>
              <input
                id="promote-user-id"
                value={promoteUserId}
                onChange={(e) => setPromoteUserId(e.target.value.trim())}
                placeholder="User ID"
                className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm font-mono"
                disabled={showBusy}
              />
              <Button
                type="button"
                size="sm"
                className="mt-2"
                disabled={showBusy || !OBJECT_ID_RE.test(promoteUserId)}
                onClick={() => onPromoteMember?.(promoteUserId)}
              >
                Promote
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              Members ({resolvedMemberTotal})
            </h3>
          </div>
          <div className="rounded-lg border border-border px-3">
            {!detailLoading && members.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No members in this group response.
              </p>
            ) : (
              members.map((m) => <GroupMemberRow key={m.id} member={m} />)
            )}
          </div>
          {resolvedMemberTotal > members.length ? (
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View all Members
              <ChevronRight className="size-4" />
            </button>
          ) : null}
        </div>

        <div
          className={
            canDeleteGroup
              ? "mt-8 grid grid-cols-2 gap-3"
              : "mt-8 grid grid-cols-1 gap-3"
          }
        >
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
          {canDeleteGroup ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-lg border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              disabled={showBusy}
              onClick={() => onDeleteGroup?.()}
            >
              Delete Group
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
