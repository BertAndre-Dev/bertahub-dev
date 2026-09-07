"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type {
  CommunityChatGroup,
  CommunityMember,
} from "@/types/community-chat-ui";
import { chatGroupMemberUsersToRows, formatGroupStatus } from "@/lib/community-chat-ui";
import type { ChatGroupRoleToAdd } from "@/types/community-group";
import { GroupMemberRow } from "./GroupMemberRow";
import { CommunityGroupAvatar } from "./CommunityGroupAvatar";
import { getAllUsersByEstate } from "@/redux/slice/admin/user-mgt/user";
import { getGroupMembers } from "@/redux/slice/community-group/community-group-thunks";
import type { AppDispatch } from "@/redux/store";
import { chatGroupRoleToApiRole } from "@/lib/estate-user-roles";
import DeleteModal from "@/components/resident/delete-modal/page";
import { getApiErrorMessage } from "@/lib/api-error";

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

const ROLE_OPTIONS: { label: string; value: ChatGroupRoleToAdd }[] = [
  { label: "Residents", value: "RESIDENT" },
  { label: "Staff", value: "STAFF" },
  { label: "Security", value: "SECURITY" },
  { label: "Estate admins", value: "ESTATE_ADMIN" },
];

type EstateUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive?: boolean;
};

function normalizeEstateListUser(raw: unknown): EstateUserRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const idRaw = o.id ?? o._id;
  const id = typeof idRaw === "string" ? idRaw.trim() : String(idRaw ?? "").trim();
  if (!OBJECT_ID_RE.test(id)) return null;
  const firstName = typeof o.firstName === "string" ? o.firstName : "";
  const lastName = typeof o.lastName === "string" ? o.lastName : "";
  const email = typeof o.email === "string" ? o.email : "";
  const role = typeof o.role === "string" ? o.role : "—";
  const isActive = typeof o.isActive === "boolean" ? o.isActive : undefined;
  return { id, firstName, lastName, email, role, isActive };
}

function displayName(u: EstateUserRow): string {
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return n || u.email || u.id;
}

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  group: CommunityChatGroup | null;
  members: CommunityMember[];
  memberTotal?: number;
  onDeleteGroup?: () => void | Promise<void>;
  onUpdateGroup?: (payload: {
    name: string;
    description: string;
  }) => void | Promise<void>;
  updateLoading?: boolean;
  detailLoading?: boolean;
  showMemberAdminTools?: boolean;
  canUpdateGroupProfile?: boolean;
  canDeleteGroup?: boolean;
  membersActionLoading?: boolean;
  onAddMembersByIds?: (memberIds: string[]) => void | Promise<void>;
  onAddAllSameRole?: (roleToAdd: ChatGroupRoleToAdd) => void | Promise<void>;
  onRemoveMembersByIds?: (memberIds: string[]) => void | Promise<void>;
  // Promote-admin temporarily disabled.
  onPromoteMember?: (userId: string) => void | Promise<void>;
  estateDisplayName?: string | null;
  /** Used to load estate users for the add-member picker. */
  estateId?: string | null;
}>;

export function GroupInfoModal({
  open,
  onClose,
  group,
  members,
  memberTotal,
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
  onPromoteMember: _onPromoteMember,
  estateDisplayName,
  estateId,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(group?.name ?? "");
  const [editAbout, setEditAbout] = useState(group?.about ?? "");
  const [roleToAdd, setRoleToAdd] = useState<ChatGroupRoleToAdd>("RESIDENT");

  const [estateSearchInput, setEstateSearchInput] = useState("");
  const [debouncedEstateSearch, setDebouncedEstateSearch] = useState("");
  const [estateUsers, setEstateUsers] = useState<EstateUserRow[]>([]);
  const [estateUsersPage, setEstateUsersPage] = useState(1);
  const [estateUsersTotalPages, setEstateUsersTotalPages] = useState(1);
  const [estateUsersLoading, setEstateUsersLoading] = useState(false);
  const [selectedIdsToAdd, setSelectedIdsToAdd] = useState<string[]>([]);
  const [listMembers, setListMembers] = useState<CommunityMember[]>([]);
  const [listMembersLoading, setListMembersLoading] = useState(false);
  const [listMembersFetched, setListMembersFetched] = useState(false);
  const [listMembersTotal, setListMembersTotal] = useState(0);
  const [listMembersPage, setListMembersPage] = useState(1);
  const [listMembersTotalPages, setListMembersTotalPages] = useState(1);
  const [memberToRemove, setMemberToRemove] = useState<CommunityMember | null>(
    null,
  );
  const [removingMember, setRemovingMember] = useState(false);
  // Promote-admin temporarily disabled.
  // const [memberToPromote, setMemberToPromote] =
  //   useState<CommunityMember | null>(null);
  // const [promotingMember, setPromotingMember] = useState(false);

  const displayMembers = listMembersFetched ? listMembers : members;
  const displayMemberTotal = listMembersFetched
    ? listMembersTotal
    : (memberTotal ?? group?.memberCount ?? displayMembers.length);

  useEffect(() => {
    const t = globalThis.setTimeout(
      () => setDebouncedEstateSearch(estateSearchInput.trim()),
      400,
    );
    return () => globalThis.clearTimeout(t);
  }, [estateSearchInput]);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      return;
    }
    setEditName(group?.name ?? "");
    setEditAbout(group?.about ?? "");
    setEstateSearchInput("");
    setDebouncedEstateSearch("");
    setEstateUsers([]);
    setEstateUsersPage(1);
    setEstateUsersTotalPages(1);
    setSelectedIdsToAdd([]);
    setListMembers([]);
    setListMembersFetched(false);
    setListMembersTotal(0);
    setListMembersPage(1);
    setListMembersTotalPages(1);
    setMemberToRemove(null);
    setRemovingMember(false);
    // setMemberToPromote(null);
    // setPromotingMember(false);
  }, [open, group?.id, group?.name, group?.about]);

  const fetchGroupMembersList = useCallback(
    async (page: number, append: boolean) => {
      const groupId = (group?.id ?? "").trim();
      if (!groupId) {
        if (!append) setListMembers([]);
        return;
      }
      setListMembersLoading(true);
      try {
        const res = await dispatch(
          getGroupMembers({ groupId, page, limit: 50 }),
        ).unwrap();
        const rows = chatGroupMemberUsersToRows(
          res?.data ?? [],
          group?.adminIds,
        );
        setListMembers((prev) => (append ? [...prev, ...rows] : rows));
        const total =
          typeof res?.pagination?.total === "number"
            ? res.pagination.total
            : rows.length;
        const pages =
          typeof res?.pagination?.pages === "number" && res.pagination.pages >= 1
            ? res.pagination.pages
            : 1;
        setListMembersTotal(total);
        setListMembersPage(page);
        setListMembersTotalPages(pages);
        setListMembersFetched(true);
      } catch (e: unknown) {
        const message = getApiErrorMessage(e);
        if (message) toast.error(message);
        if (!append) {
          setListMembers([]);
          setListMembersFetched(false);
        }
      } finally {
        setListMembersLoading(false);
      }
    },
    [dispatch, group?.id, group?.adminIds],
  );

  useEffect(() => {
    if (!open || !(group?.id ?? "").trim()) return;
    void fetchGroupMembersList(1, false);
  }, [open, group?.id, fetchGroupMembersList]);

  const idsInGroup = useMemo(() => {
    const s = new Set<string>();
    group?.memberUsers?.forEach((m) => s.add(m.id));
    group?.memberIds?.forEach((id) => {
      const v = typeof id === "string" ? id : String(id);
      if (OBJECT_ID_RE.test(v)) s.add(v);
    });
    displayMembers.forEach((m) => s.add(m.id));
    return s;
  }, [group?.memberUsers, group?.memberIds, displayMembers]);

  const fetchEstateUsers = useCallback(
    async (page: number, append: boolean) => {
      const eid = (estateId ?? "").trim();
      if (!eid || !showMemberAdminTools) {
        if (!append) setEstateUsers([]);
        return;
      }
      setEstateUsersLoading(true);
      try {
        const res = (await dispatch(
          getAllUsersByEstate({
            estateId: eid,
            page,
            limit: 25,
            role: chatGroupRoleToApiRole(roleToAdd),
            search: debouncedEstateSearch || undefined,
          }),
        ).unwrap()) as {
          data?: unknown[];
          pagination?: {
            totalPages?: number;
            pages?: number;
            currentPage?: number;
            page?: number;
          };
        };
        const raw = Array.isArray(res?.data) ? res.data : [];
        const rows = raw
          .map(normalizeEstateListUser)
          .filter((u): u is EstateUserRow => u !== null);
        setEstateUsers((prev) => (append ? [...prev, ...rows] : rows));
        const p = res?.pagination;
        const totalPages =
          typeof p?.totalPages === "number" && p.totalPages >= 1
            ? p.totalPages
            : typeof p?.pages === "number" && p.pages >= 1
              ? p.pages
              : 1;
        setEstateUsersTotalPages(totalPages);
        setEstateUsersPage(page);
      } catch (e: unknown) {
        const message = getApiErrorMessage(e);
        if (message) toast.error(message);
        if (!append) setEstateUsers([]);
      } finally {
        setEstateUsersLoading(false);
      }
    },
    [dispatch, estateId, showMemberAdminTools, debouncedEstateSearch, roleToAdd],
  );

  useEffect(() => {
    if (!open || !showMemberAdminTools || !(estateId ?? "").trim()) {
      return;
    }
    void fetchEstateUsers(1, false);
  }, [
    open,
    showMemberAdminTools,
    estateId,
    debouncedEstateSearch,
    roleToAdd,
    fetchEstateUsers,
  ]);

  const availableToAdd = useMemo(
    () => estateUsers.filter((u) => !idsInGroup.has(u.id)),
    [estateUsers, idsInGroup],
  );

  const toggleSelectAdd = (id: string) => {
    setSelectedIdsToAdd((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAddSelectedFromPicker = async () => {
    if (!selectedIdsToAdd.length || !onAddMembersByIds) return;
    try {
      await onAddMembersByIds(selectedIdsToAdd);
      setSelectedIdsToAdd([]);
      await fetchEstateUsers(estateUsersPage, false);
      await fetchGroupMembersList(1, false);
    } catch {
      /* parent toasted */
    }
  };

  const handleRemoveMember = (userId: string) => {
    const member =
      displayMembers.find((m) => m.id === userId) ??
      ({
        id: userId,
        name: "this member",
        subtitle: "Member",
        tag: "Member",
        avatarColor: "gray",
      } satisfies CommunityMember);
    setMemberToRemove(member);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !onRemoveMembersByIds) return;
    setRemovingMember(true);
    try {
      await onRemoveMembersByIds([memberToRemove.id]);
      setMemberToRemove(null);
      await fetchGroupMembersList(1, false);
    } catch (e: unknown) {
      // Parent already toasts API error; rethrow so DeleteModal stays open.
      throw e;
    } finally {
      setRemovingMember(false);
    }
  };

  // Promote-admin temporarily disabled.
  // const handlePromote = (userId: string) => {
  //   if (!_onPromoteMember) return;
  //   const member =
  //     displayMembers.find((m) => m.id === userId) ??
  //     ({
  //       id: userId,
  //       name: "this member",
  //       subtitle: "Member",
  //       tag: "Member",
  //       avatarColor: "gray",
  //     } satisfies CommunityMember);
  //   setMemberToPromote(member);
  // };

  // const handleConfirmPromoteMember = async () => {
  //   if (!memberToPromote || !_onPromoteMember) return;
  //   setPromotingMember(true);
  //   try {
  //     await _onPromoteMember(memberToPromote.id);
  //     setMemberToPromote(null);
  //     await fetchGroupMembersList(1, false);
  //   } catch (e: unknown) {
  //     throw e;
  //   } finally {
  //     setPromotingMember(false);
  //   }
  // };

  if (!open) return null;

  if (!group) {
    return (
      <div
        className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="relative flex h-[90vh] w-full max-w-lg cursor-default flex-col overflow-hidden rounded-xl bg-card p-6 shadow-xl"
          role="dialog"
          aria-labelledby="group-info-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex size-9 cursor-pointer items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          <h2 id="group-info-title" className="text-lg font-bold">
            Group Info
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

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

  const hasEstateForPicker = Boolean((estateId ?? "").trim());

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && !showBusy && onClose()}
    >
      <div
        className="relative flex h-[70vh] w-full max-w-lg cursor-default flex-col overflow-hidden rounded-xl bg-card shadow-xl"
        role="dialog"
        aria-labelledby="group-info-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={showBusy}
          className="absolute right-4 top-4 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
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
                  className="w-full cursor-text rounded-lg border border-border bg-background px-2 py-1 text-sm font-semibold"
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
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 border-b border-border pb-4">
          {editing && canUpdateGroupProfile ? (
            <textarea
              value={editAbout}
              onChange={(e) => setEditAbout(e.target.value)}
              className="min-h-[80px] flex-1 cursor-text rounded-lg border border-border bg-background px-2 py-1 text-sm leading-relaxed"
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
              className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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
              className="cursor-pointer disabled:cursor-not-allowed"
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
              className="cursor-pointer disabled:cursor-not-allowed"
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
          <div className="mt-6 space-y-5 rounded-lg border border-border bg-muted/20 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Add members to group
            </h3>

            <div>
              <Label htmlFor="add-all-role">Bulk add by role</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Adds every active user in the estate with the selected role.
              </p>
              <Select
                id="add-all-role"
                value={roleToAdd}
                onChange={(e) =>
                  setRoleToAdd(e.target.value as ChatGroupRoleToAdd)
                }
                options={ROLE_OPTIONS}
                className="mt-1 h-10 cursor-pointer"
                disabled={showBusy}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-2 cursor-pointer disabled:cursor-not-allowed"
                disabled={showBusy}
                onClick={() => onAddAllSameRole?.(roleToAdd)}
              >
                {`Add ${(
                  ROLE_OPTIONS.find((o) => o.value === roleToAdd)?.label ??
                  "users"
                ).toLowerCase()}s`}
              </Button>
            </div>

            {hasEstateForPicker ? (
              <div className="space-y-3 border-t border-border pt-4">
                <Label htmlFor="estate-user-search">Add people from your estate</Label>
                <Input
                  id="estate-user-search"
                  value={estateSearchInput}
                  onChange={(e) => setEstateSearchInput(e.target.value)}
                  placeholder="Search by name or email…"
                  disabled={showBusy}
                  className="h-10 cursor-text"
                />
                <div className="h-[180px] overflow-y-auto rounded-lg border border-border bg-background">
                  {estateUsersLoading && availableToAdd.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      Loading users…
                    </p>
                  ) : availableToAdd.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      {debouncedEstateSearch
                        ? "No users match this search, or everyone listed is already in the group."
                        : `All ${(
                            ROLE_OPTIONS.find((o) => o.value === roleToAdd)
                              ?.label ?? "users with this role"
                          ).toLowerCase()} have already been added to the group.`}
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {availableToAdd.map((u) => {
                        const checked = selectedIdsToAdd.includes(u.id);
                        return (
                          <li key={u.id}>
                            <label
                              htmlFor={`estate-pick-${u.id}`}
                              className={`flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 ${showBusy ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <input
                                id={`estate-pick-${u.id}`}
                                type="checkbox"
                                className="size-4 shrink-0 cursor-pointer rounded border-input accent-primary disabled:cursor-not-allowed"
                                checked={checked}
                                disabled={showBusy}
                                onChange={() => toggleSelectAdd(u.id)}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {displayName(u)}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {u.email} · {u.role}
                                  {u.isActive === false ? (
                                    <span className="text-amber-600"> · inactive</span>
                                  ) : null}
                                </p>
                              </div>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="cursor-pointer disabled:cursor-not-allowed"
                    disabled={
                      showBusy ||
                      selectedIdsToAdd.length === 0 ||
                      !onAddMembersByIds
                    }
                    onClick={() => void handleAddSelectedFromPicker()}
                  >
                    Add selected ({selectedIdsToAdd.length})
                  </Button>
                  {estateUsersPage < estateUsersTotalPages ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer disabled:cursor-not-allowed"
                      disabled={showBusy || estateUsersLoading}
                      onClick={() =>
                        void fetchEstateUsers(estateUsersPage + 1, true)
                      }
                    >
                      {estateUsersLoading ? "Loading…" : "Load more"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                This group has no estate id in the response, so the people picker
                cannot load. Use bulk add by role, or ensure the API returns{" "}
                <code className="rounded bg-muted px-1">estateId</code> on the
                group.
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              Members ({displayMemberTotal})
            </h3>
          </div>
          <div className="h-[180px] overflow-y-auto rounded-lg border border-border px-3">
            {listMembersLoading && displayMembers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Loading members…
              </p>
            ) : !detailLoading &&
              !listMembersLoading &&
              displayMembers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No members in this group.
              </p>
            ) : (
              <>
                {displayMembers.map((m) => (
                  <GroupMemberRow
                    key={m.id}
                    member={m}
                    showActions={showMemberAdminTools}
                    actionsDisabled={showBusy || listMembersLoading}
                    onRemoveMember={
                      onRemoveMembersByIds
                        ? (id) => void handleRemoveMember(id)
                        : undefined
                    }
                    // onPromoteMember={
                    //   _onPromoteMember
                    //     ? (id) => handlePromote(id)
                    //     : undefined
                    // }
                  />
                ))}
                {listMembersPage < listMembersTotalPages ? (
                  <div className="py-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full cursor-pointer disabled:cursor-not-allowed"
                      disabled={showBusy || listMembersLoading}
                      onClick={() =>
                        void fetchGroupMembersList(listMembersPage + 1, true)
                      }
                    >
                      {listMembersLoading ? "Loading…" : "Load more members"}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        {canDeleteGroup ? (
          <div className="mt-8 w-full">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full cursor-pointer rounded-lg border-red-600 text-red-600 hover:bg-red-300 disabled:cursor-not-allowed dark:hover:bg-red-950/30"
              disabled={showBusy}
              onClick={() => onDeleteGroup?.()}
            >
              Delete Group
            </Button>
          </div>
        ) : null}
        </div>
      </div>

      <DeleteModal
        visible={!!memberToRemove}
        onClose={() => {
          if (removingMember) return;
          setMemberToRemove(null);
        }}
        itemName={memberToRemove?.name || "this member"}
        title="Remove member"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        loading={removingMember}
        message={
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to remove{" "}
            <strong>{memberToRemove?.name || "this member"}</strong> from this
            group? They can be added again later.
          </p>
        }
        onConfirm={handleConfirmRemoveMember}
      />

      {/* Promote-admin temporarily disabled.
      <DeleteModal
        visible={!!memberToPromote}
        onClose={() => {
          if (promotingMember) return;
          setMemberToPromote(null);
        }}
        itemName={memberToPromote?.name || "this member"}
        title="Make group admin"
        confirmLabel="Promote"
        cancelLabel="Cancel"
        loading={promotingMember}
        loadingLabel="Promoting…"
        confirmClassName="bg-primary text-primary-foreground hover:bg-primary/90"
        message={
          <p className="text-sm text-muted-foreground mb-4">
            Make <strong>{memberToPromote?.name || "this member"}</strong> a
            group admin? They will be able to manage members for this group.
          </p>
        }
        onConfirm={handleConfirmPromoteMember}
      />
      */}
    </div>
  );
}
