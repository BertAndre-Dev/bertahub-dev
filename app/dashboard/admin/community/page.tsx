"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CommunityPageHeader } from "@/components/dashboard/admin/community/CommunityPageHeader";
import { CommunityChatSidebar } from "@/components/dashboard/admin/community/CommunityChatSidebar";
import { CommunityChatWindow } from "@/components/dashboard/admin/community/CommunityChatWindow";
import { CreateGroupChatModal } from "@/components/dashboard/admin/community/CreateGroupChatModal";
import { GroupInfoModal } from "@/components/dashboard/admin/community/GroupInfoModal";
import {
  chatGroupToCommunity,
  chatGroupMemberRowsFromApi,
} from "@/data/community-chat-dummy";
import { groupMessageToCommunity } from "@/lib/community-chat-map";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  clearGroupDetail,
  clearCommunityGroupError,
  clearGroupMessages,
} from "@/redux/slice/community-group/community-group-slice";
import {
  addGroupMembers,
  createChatGroup,
  deleteChatGroup,
  deleteGroupMessage,
  editGroupMessage,
  getChatGroupById,
  getChatGroups,
  getGroupMessages,
  promoteGroupAdmin,
  removeGroupMembers,
  sendGroupMessage,
  updateChatGroup,
} from "@/redux/slice/community-group/community-group-thunks";
import type { ChatGroup, ChatGroupRoleToAdd } from "@/types/community-group";
import type { RootState, AppDispatch } from "@/redux/store";
import Loader from "@/components/ui/Loader";

export default function AdminCommunityChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [draftByGroup, setDraftByGroup] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const {
    groups,
    listLoading,
    createLoading,
    updateLoading,
    groupDetail,
    detailLoading,
    groupMessages,
    messagesLoading,
    sendMessageLoading,
    editMessageLoading,
    deleteMessageLoading,
    membersActionLoading,
  } = useSelector((state: RootState) => {
    const s = state.communityGroup;
    return {
      groups: s.groups,
      listLoading: s.listLoading,
      createLoading: s.createLoading,
      updateLoading: s.updateLoading,
      groupDetail: s.groupDetail,
      detailLoading: s.detailLoading,
      groupMessages: s.groupMessages,
      messagesLoading: s.messagesLoading,
      sendMessageLoading: s.sendMessageLoading,
      editMessageLoading: s.editMessageLoading,
      deleteMessageLoading: s.deleteMessageLoading,
      membersActionLoading: s.membersActionLoading,
    };
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await dispatch(getSignedInUser()).unwrap();
        const data = (res as { data?: Record<string, unknown> })?.data ?? res;
        const id =
          typeof (data as { id?: string })?.id === "string"
            ? (data as { id: string }).id
            : typeof (data as { _id?: string })?._id === "string"
              ? (data as { _id: string })._id
              : null;
        setCurrentUserId(id);
      } catch {
        setCurrentUserId(null);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    const t = globalThis.setTimeout(() => setDebouncedSearch(search), 400);
    return () => globalThis.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await dispatch(
          getChatGroups({
            page: 1,
            limit: 50,
            search: debouncedSearch.trim() || undefined,
          }),
        ).unwrap();
        if (cancelled) return;
        dispatch(clearCommunityGroupError());
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e &&
          typeof e === "object" &&
          "message" in e &&
          typeof (e as { message?: string }).message === "string"
            ? (e as { message: string }).message
            : "Failed to load groups.";
        toast.error(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, debouncedSearch]);

  useEffect(() => {
    if (groups.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => {
      if (prev && groups.some((g) => g._id === prev)) return prev;
      return groups[0]._id;
    });
  }, [groups]);

  useEffect(() => {
    if (!selectedId) {
      dispatch(clearGroupDetail());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await dispatch(getChatGroupById({ groupId: selectedId })).unwrap();
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e &&
          typeof e === "object" &&
          "message" in e &&
          typeof (e as { message?: string }).message === "string"
            ? (e as { message: string }).message
            : "Failed to load group details.";
        toast.error(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      dispatch(clearGroupMessages());
      return;
    }
    dispatch(clearGroupMessages());
    let cancelled = false;
    (async () => {
      try {
        await dispatch(
          getGroupMessages({ groupId: selectedId, page: 1, limit: 50 }),
        ).unwrap();
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e &&
          typeof e === "object" &&
          "message" in e &&
          typeof (e as { message?: string }).message === "string"
            ? (e as { message: string }).message
            : "Failed to load messages.";
        toast.error(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, selectedId]);

  const displayGroups = useMemo(
    () => groups.map(chatGroupToCommunity),
    [groups],
  );

  const mergedChatGroup = useMemo((): ChatGroup | null => {
    if (!selectedId) return null;
    const fromList = groups.find((g) => g._id === selectedId) ?? null;
    const detail =
      groupDetail && groupDetail._id === selectedId ? groupDetail : null;
    if (!fromList && !detail) return null;
    if (fromList && detail) {
      const members =
        detail.members && detail.members.length > 0
          ? detail.members
          : fromList.members;
      const admins =
        detail.admins && detail.admins.length > 0
          ? detail.admins
          : fromList.admins;
      const memberCount = Math.max(
        fromList.memberCount ?? 0,
        detail.memberCount ?? 0,
        members?.length ?? 0,
        fromList.members?.length ?? 0,
      );
      return {
        ...fromList,
        ...detail,
        members,
        admins,
        memberCount,
        description: detail.description ?? fromList.description,
      };
    }
    return detail ?? fromList;
  }, [selectedId, groups, groupDetail]);

  const selectedGroupUi = useMemo(
    () => (mergedChatGroup ? chatGroupToCommunity(mergedChatGroup) : null),
    [mergedChatGroup],
  );

  const infoModalMembers = useMemo(
    () =>
      selectedGroupUi ? chatGroupMemberRowsFromApi(selectedGroupUi) : [],
    [selectedGroupUi],
  );

  const messages = useMemo(
    () =>
      groupMessages.map((m) =>
        groupMessageToCommunity(m, currentUserId, "You (Facility Manager)"),
      ),
    [groupMessages, currentUserId],
  );

  const draft = selectedId ? draftByGroup[selectedId] ?? "" : "";

  const handleSend = useCallback(async () => {
    if (!selectedId) return;
    const text = draft.trim();
    if (!text) return;
    try {
      await dispatch(
        sendGroupMessage({
          groupId: selectedId,
          content: text,
          messageType: "text",
        }),
      ).unwrap();
      setDraftByGroup((prev) => ({ ...prev, [selectedId]: "" }));
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: string }).message === "string"
          ? (e as { message: string }).message
          : "Could not send message.";
      toast.error(msg);
    }
  }, [selectedId, draft, dispatch]);

  const handleEditMessage = useCallback(
    (messageId: string) => {
      const current = messages.find((m) => m.id === messageId)?.text ?? "";
      const next = globalThis.prompt("Edit message", current);
      if (next == null || next.trim() === "" || next === current) return;
      void (async () => {
        try {
          await dispatch(
            editGroupMessage({ messageId, content: next.trim() }),
          ).unwrap();
          toast.success("Message updated.");
        } catch (e: unknown) {
          const msg =
            e &&
            typeof e === "object" &&
            "message" in e &&
            typeof (e as { message?: string }).message === "string"
              ? (e as { message: string }).message
              : "Could not update message.";
          toast.error(msg);
        }
      })();
    },
    [dispatch, messages],
  );

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      confirmDeleteToast({
        name: "this message",
        onConfirm: async () => {
          await dispatch(deleteGroupMessage({ messageId })).unwrap();
          toast.success("Message deleted.");
        },
      });
    },
    [dispatch],
  );

  const handleCreateGroup = async (payload: {
    name: string;
    description: string;
    profileImage?: string;
  }) => {
    try {
      const res = await dispatch(
        createChatGroup({
          name: payload.name,
          description: payload.description || undefined,
          profileImage: payload.profileImage,
        }),
      ).unwrap();
      toast.success("Group created.");
      setCreateOpen(false);
      if (res.data?._id) setSelectedId(res.data._id);
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: string }).message === "string"
          ? (e as { message: string }).message
          : "Could not create group.";
      toast.error(msg);
    }
  };

  const handleUpdateGroup = async (p: { name: string; description: string }) => {
    if (!selectedId) return;
    try {
      await dispatch(
        updateChatGroup({
          groupId: selectedId,
          name: p.name,
          description: p.description,
        }),
      ).unwrap();
      toast.success("Group updated.");
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: string }).message === "string"
          ? (e as { message: string }).message
          : "Could not update group.";
      toast.error(msg);
      throw e;
    }
  };

  const handleDeleteGroup = () => {
    if (!selectedId || !selectedGroupUi) return;
    confirmDeleteToast({
      name: selectedGroupUi.name,
      onConfirm: async () => {
        await dispatch(deleteChatGroup({ groupId: selectedId })).unwrap();
        toast.success("Group deleted.");
        setGroupInfoOpen(false);
      },
    });
  };

  const refreshGroupMeta = async () => {
    if (!selectedId) return;
    await dispatch(getChatGroupById({ groupId: selectedId })).unwrap();
    await dispatch(
      getChatGroups({
        page: 1,
        limit: 50,
        search: debouncedSearch.trim() || undefined,
      }),
    ).unwrap();
  };

  const handleAddMembersByIds = async (memberIds: string[]) => {
    if (!selectedId || !memberIds.length) return;
    try {
      await dispatch(addGroupMembers({ groupId: selectedId, memberIds })).unwrap();
      toast.success("Members added.");
      await refreshGroupMeta();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: string }).message === "string"
          ? (e as { message: string }).message
          : "Failed to add members.";
      toast.error(msg);
    }
  };

  const handleAddAllSameRole = async (roleToAdd: ChatGroupRoleToAdd) => {
    if (!selectedId) return;
    try {
      await dispatch(
        addGroupMembers({
          groupId: selectedId,
          addAllSameRole: true,
          roleToAdd,
        }),
      ).unwrap();
      toast.success("Members added.");
      await refreshGroupMeta();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: string }).message === "string"
          ? (e as { message: string }).message
          : "Failed to add members.";
      toast.error(msg);
    }
  };

  const handleRemoveMembersByIds = async (memberIds: string[]) => {
    if (!selectedId || !memberIds.length) return;
    try {
      await dispatch(
        removeGroupMembers({ groupId: selectedId, memberIds }),
      ).unwrap();
      toast.success("Members removed.");
      await refreshGroupMeta();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: string }).message === "string"
          ? (e as { message: string }).message
          : "Failed to remove members.";
      toast.error(msg);
    }
  };

  const handlePromoteMember = async (userId: string) => {
    if (!selectedId) return;
    try {
      await dispatch(promoteGroupAdmin({ groupId: selectedId, userId })).unwrap();
      toast.success("Member promoted.");
      await refreshGroupMeta();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: string }).message === "string"
          ? (e as { message: string }).message
          : "Failed to promote member.";
      toast.error(msg);
    }
  };

  const emptySidebar =
    listLoading !== "isLoading" &&
    displayGroups.length === 0 &&
    !debouncedSearch.trim();

  let emptyPanelTitle = "No group selected.";
  if (listLoading === "isLoading") emptyPanelTitle = "Loading groups…";
  else if (emptySidebar) emptyPanelTitle = "No community groups yet.";

  const pageLoading = listLoading === "isLoading";

  return (
    <div className="relative mx-auto max-w-[1400px] space-y-6">
      {pageLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm rounded-xl">
          <Loader label="Loading community..." />
        </div>
      )}

      <div
        className={[
          "space-y-6",
          pageLoading ? "blur-sm opacity-60 pointer-events-none select-none" : "",
        ].join(" ")}
      >
      <CommunityPageHeader onCreateGroup={() => setCreateOpen(true)} />

      <div className="grid min-h-[560px] grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,340px)_1fr] lg:gap-6">
        <CommunityChatSidebar
          groups={displayGroups}
          selectedId={selectedId}
          search={search}
          onSearchChange={setSearch}
          onSelectGroup={setSelectedId}
        />
        {selectedGroupUi ? (
          <CommunityChatWindow
            group={selectedGroupUi}
            messages={messages}
            messagesLoading={messagesLoading === "isLoading"}
            draft={draft}
            onDraftChange={(v) =>
              selectedId &&
              setDraftByGroup((prev) => ({ ...prev, [selectedId]: v }))
            }
            onSend={handleSend}
            onOpenGroupInfo={() => setGroupInfoOpen(true)}
            sendDisabled={sendMessageLoading === "isLoading"}
            sending={sendMessageLoading === "isLoading"}
            currentUserId={currentUserId}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            messageActionsDisabled={
              editMessageLoading === "isLoading" ||
              deleteMessageLoading === "isLoading"
            }
          />
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center md:min-h-[calc(100vh-220px)]">
            <p className="text-sm font-medium text-foreground">
              {emptyPanelTitle}
            </p>
            {listLoading !== "isLoading" && emptySidebar ? (
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Create a group so residents can chat within your estate.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <CreateGroupChatModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        isSubmitting={createLoading === "isLoading"}
        onCreate={handleCreateGroup}
      />

      {selectedGroupUi ? (
        <GroupInfoModal
          open={groupInfoOpen}
          onClose={() => setGroupInfoOpen(false)}
          group={selectedGroupUi}
          members={infoModalMembers}
          memberTotal={selectedGroupUi.memberCount}
          detailLoading={detailLoading === "isLoading"}
          updateLoading={updateLoading === "isLoading"}
          membersActionLoading={membersActionLoading === "isLoading"}
          showMemberAdminTools
          canUpdateGroupProfile
          canDeleteGroup
          onUpdateGroup={handleUpdateGroup}
          onExitGroup={() => {
            toast.info("Leaving a community group is not available yet.");
          }}
          onDeleteGroup={handleDeleteGroup}
          onAddMembersByIds={handleAddMembersByIds}
          onAddAllSameRole={handleAddAllSameRole}
          onRemoveMembersByIds={handleRemoveMembersByIds}
          onPromoteMember={handlePromoteMember}
        />
      ) : null}
      </div>
    </div>
  );
}