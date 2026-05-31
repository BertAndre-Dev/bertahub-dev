"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CommunityPageHeader } from "@/components/dashboard/admin/community/CommunityPageHeader";
import { CommunityChatSidebar } from "@/components/dashboard/admin/community/CommunityChatSidebar";
import { CommunityChatWindow } from "@/components/dashboard/admin/community/CommunityChatWindow";
import { CreateGroupChatModal } from "@/components/dashboard/admin/community/CreateGroupChatModal";
import { GroupInfoModal } from "@/components/dashboard/admin/community/GroupInfoModal";
import CommunityEditMessageModal, {
  getCommunityActionError,
} from "@/components/dashboard/admin/community/CommunityEditMessageModal";
import {
  chatGroupToCommunity,
  chatGroupMemberRowsFromApi,
} from "@/lib/community-chat-ui";
import { groupMessageToCommunity } from "@/lib/community-chat-map";
import { displayNameFromSignedInUser } from "@/lib/user-display-name";
import { extractUserId } from "@/lib/user-id";
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
  replyToGroupMessage,
  sendGroupMessage,
  updateChatGroup,
} from "@/redux/slice/community-group/community-group-thunks";
import type { ChatGroup, ChatGroupRoleToAdd, GroupMessageType } from "@/types/community-group";
import type { CommunityReplyTarget } from "@/types/community-chat-ui";
import type { RootState, AppDispatch } from "@/redux/store";
import Loader from "@/components/ui/Loader";
import { useCommunityChatGroupRoom } from "@/hooks/useCommunityChatGroupRoom";

export default function AdminCommunityChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [draftByGroup, setDraftByGroup] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommunityReplyTarget | null>(null);
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const authUserId = useSelector((state: RootState) =>
    extractUserId((state.auth.user ?? null) as Record<string, unknown> | null),
  );
  const effectiveUserId = currentUserId ?? authUserId;
  const [estateName, setEstateName] = useState("Estate");
  const [messageSelfLabel, setMessageSelfLabel] = useState("You");

  const authToken = useSelector((state: RootState) => state.auth.token);

  useCommunityChatGroupRoom({
    groupId: selectedId,
    token: authToken,
    currentUserId: effectiveUserId,
  });

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
        const id = extractUserId(data as Record<string, unknown>);
        setCurrentUserId(id);
        const name =
          (data?.estateId as { name?: string } | undefined)?.name ??
          (data?.estate as { name?: string } | undefined)?.name ??
          (data?.estateName as string) ??
          "Estate";
        setEstateName(name);
        setMessageSelfLabel(
          displayNameFromSignedInUser(data as Record<string, unknown>),
        );
      } catch {
        setCurrentUserId(null);
        setEstateName("Estate");
        setMessageSelfLabel("You");
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

  const messages = useMemo(() => {
    const byId = new Map(groupMessages.map((m) => [m._id, m]));
    return groupMessages.map((m) =>
      groupMessageToCommunity(m, effectiveUserId, messageSelfLabel, byId),
    );
  }, [groupMessages, effectiveUserId, messageSelfLabel]);

  useEffect(() => {
    setReplyingTo(null);
  }, [selectedId]);

  const draft = selectedId ? draftByGroup[selectedId] ?? "" : "";

  const handleSend = useCallback(
    async (opts?: { attachments?: string[]; messageType?: GroupMessageType }) => {
      if (!selectedId) return;
      const text = draft.trim();
      const hasAtt = Boolean(opts?.attachments?.length);
      if (!text && !hasAtt) return;
      try {
        if (replyingTo) {
          await dispatch(
            replyToGroupMessage({
              groupId: selectedId,
              messageId: replyingTo.messageId,
              content: text,
              messageType: opts?.messageType ?? "text",
              attachments: hasAtt ? opts?.attachments : undefined,
            }),
          ).unwrap();
          setReplyingTo(null);
        } else {
          await dispatch(
            sendGroupMessage({
              groupId: selectedId,
              content: text,
              messageType: opts?.messageType ?? "text",
              attachments: hasAtt ? opts?.attachments : undefined,
            }),
          ).unwrap();
        }
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
        throw e;
      }
    },
    [selectedId, draft, dispatch, replyingTo],
  );

  const handleReplyMessage = useCallback(
    (messageId: string) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target || target.isDeleted) return;
      setReplyingTo({
        messageId: target.id,
        sender: target.sender,
        text: target.text,
      });
    },
    [messages],
  );

  const handleEditMessage = useCallback(
    (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message || message.isDeleted) return;
      setEditError(null);
      setEditingMessage({ id: messageId, text: message.text });
    },
    [messages],
  );

  const handleEditSubmit = useCallback(
    async (content: string) => {
      if (!editingMessage) return;
      setEditError(null);
      try {
        await dispatch(
          editGroupMessage({
            messageId: editingMessage.id,
            content,
          }),
        ).unwrap();
        toast.success("Message updated.");
        setEditingMessage(null);
        setEditError(null);
      } catch (e: unknown) {
        setEditError(getCommunityActionError(e, "Could not update message."));
      }
    },
    [dispatch, editingMessage],
  );

  const closeEditModal = useCallback(() => {
    if (editMessageLoading === "isLoading") return;
    setEditingMessage(null);
    setEditError(null);
  }, [editMessageLoading]);

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
      throw e;
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
      throw e;
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
      throw e;
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
      throw e;
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
      <CommunityPageHeader
        estateName={estateName}
        onCreateGroup={() => setCreateOpen(true)}
      />

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
            currentUserId={effectiveUserId}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onReplyMessage={handleReplyMessage}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
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
                Create a group so residents can chat within {estateName}.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <CreateGroupChatModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        estateDisplayName={estateName}
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
          estateDisplayName={estateName}
          estateId={selectedGroupUi.estateId}
          detailLoading={detailLoading === "isLoading"}
          updateLoading={updateLoading === "isLoading"}
          membersActionLoading={membersActionLoading === "isLoading"}
          showMemberAdminTools
          canUpdateGroupProfile
          canDeleteGroup
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
          onAddMembersByIds={handleAddMembersByIds}
          onAddAllSameRole={handleAddAllSameRole}
          onRemoveMembersByIds={handleRemoveMembersByIds}
          onPromoteMember={handlePromoteMember}
        />
      ) : null}

      <CommunityEditMessageModal
        visible={Boolean(editingMessage)}
        initialContent={editingMessage?.text ?? ""}
        loading={editMessageLoading === "isLoading"}
        error={editError}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
      />
      </div>
    </div>
  );
}