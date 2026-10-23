"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";

import { CommunityPageHeader } from "@/components/dashboard/admin/community/CommunityPageHeader";
import { CommunityChatSidebar } from "@/components/dashboard/admin/community/CommunityChatSidebar";
import { CommunityChatWindow } from "@/components/dashboard/admin/community/CommunityChatWindow";
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
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  clearCommunityGroupError,
  clearGroupDetail,
  clearGroupMessages,
} from "@/redux/slice/estate-admin/community-group/community-group-slice";
import {
  deleteGroupMessage,
  editGroupMessage,
  getChatGroupById,
  getChatGroups,
  getGroupMessages,
  replyToGroupMessage,
  sendGroupMessage,
} from "@/redux/slice/estate-admin/community-group/community-group-thunks";
import type { ChatGroup, GroupMessage } from "@/types/community-group";
import type { CommunityReplyTarget } from "@/types/community-chat-ui";
import type { RootState, AppDispatch } from "@/redux/store";
import { useCommunityChatGroupRoom } from "@/hooks/useCommunityChatGroupRoom";
import Loader from "@/components/ui/Loader";
import { isBusy, isPending } from "@/lib/async-status";

export default function EstateAdminCommunityChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [draftByGroup, setDraftByGroup] = useState<Record<string, string>>({});
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommunityReplyTarget | null>(
    null,
  );
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
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
    groupDetail,
    detailLoading,
    groupMessages,
    messagesLoading,
    sendMessageLoading,
    editMessageLoading,
    deleteMessageLoading,
  } = useSelector((state: RootState) => {
    const s = (state as RootState & { estateAdminCommunityGroup: any })
      .estateAdminCommunityGroup;
    return {
      groups: s.groups,
      listLoading: s.listLoading,
      groupDetail: s.groupDetail,
      detailLoading: s.detailLoading,
      groupMessages: s.groupMessages,
      messagesLoading: s.messagesLoading,
      sendMessageLoading: s.sendMessageLoading,
      editMessageLoading: s.editMessageLoading,
      deleteMessageLoading: s.deleteMessageLoading,
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
      } finally {
        setBootstrapping(false);
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
      if (prev && groups.some((g: ChatGroup) => g._id === prev)) return prev;
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
    () => groups.map((g: ChatGroup) => chatGroupToCommunity(g)),
    [groups],
  );

  const mergedChatGroup = useMemo((): ChatGroup | null => {
    if (!selectedId) return null;
    const fromList = groups.find((g: ChatGroup) => g._id === selectedId) ?? null;
    const detail =
      groupDetail?._id === selectedId ? groupDetail : null;
    if (!fromList && !detail) return null;
    if (fromList && detail) {
      const members =
        detail.members && detail.members.length > 0
          ? detail.members
          : fromList.members;
      const admins =
        detail.admins && detail.admins.length > 0 ? detail.admins : fromList.admins;
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

  const groupMessagesUi = useMemo(() => {
    const typedMessages = groupMessages as GroupMessage[];
    const byId = new Map<string, GroupMessage>(
      typedMessages.map((m) => [m._id, m]),
    );
    return typedMessages.map((m) =>
      groupMessageToCommunity(m, effectiveUserId, messageSelfLabel, byId),
    );
  }, [groupMessages, effectiveUserId, messageSelfLabel]);

  const draft = selectedId ? draftByGroup[selectedId] ?? "" : "";
  const setDraft = useCallback(
    (value: string) => {
      if (!selectedId) return;
      setDraftByGroup((prev) => ({ ...prev, [selectedId]: value }));
    },
    [selectedId],
  );

  const openInfo = useCallback(() => setGroupInfoOpen(true), []);
  const closeInfo = useCallback(() => setGroupInfoOpen(false), []);

  const startReplyToMessage = useCallback(
    (messageId: string) => {
      const msg = groupMessagesUi.find((m: any) => m.id === messageId) ?? null;
      if (!msg) return;
      setReplyingTo({
        messageId,
        sender: msg.sender,
        text: msg.text,
      });
    },
    [groupMessagesUi],
  );

  const cancelReply = useCallback(() => setReplyingTo(null), []);

  const openEditForMessage = useCallback(
    (messageId: string) => {
      const msg = groupMessagesUi.find((m: any) => m.id === messageId) ?? null;
      if (!msg) return;
      setEditError(null);
      setEditingMessage({ id: messageId, text: msg.text ?? "" });
    },
    [groupMessagesUi],
  );

  const handleSend = useCallback(async () => {
    if (!selectedId) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      if (replyingTo?.messageId) {
        await dispatch(
          replyToGroupMessage({
            groupId: selectedId,
            messageId: replyingTo.messageId,
            content: trimmed,
            messageType: "text",
          }),
        ).unwrap();
      } else {
        await dispatch(
          sendGroupMessage({
            groupId: selectedId,
            content: trimmed,
            messageType: "text",
          }),
        ).unwrap();
      }
      setDraft("");
      setReplyingTo(null);
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: string }).message === "string"
          ? (e as { message: string }).message
          : "Failed to send message.";
      toast.error(msg);
    }
  }, [dispatch, draft, replyingTo, selectedId, setDraft]);

  const handleDelete = useCallback(
    (messageId: string) => {
      setMessageToDelete(messageId);
    },
    [],
  );

  const handleConfirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      await dispatch(deleteGroupMessage({ messageId: messageToDelete })).unwrap();
      toast.success("Message deleted.");
      setMessageToDelete(null);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      toast.error(message ?? "Failed to delete message.");
      throw err;
    }
  };

  const infoModalMembers = useMemo(
    () => (selectedGroupUi ? chatGroupMemberRowsFromApi(selectedGroupUi) : []),
    [selectedGroupUi],
  );

  const handleEditSubmit = useCallback(
    async (content: string) => {
      if (!editingMessage) return;
      setEditError(null);
      try {
        await dispatch(
          editGroupMessage({ messageId: editingMessage.id, content }),
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

  const anyLoading = isBusy(listLoading) || isBusy(detailLoading);
  const sendDisabled = !selectedId || anyLoading;
  const pageLoading = bootstrapping || isPending(listLoading);

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading community..." />}

      <div
        className={[
          "space-y-4",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
      <CommunityPageHeader
        estateName={estateName}
        showCreateGroup={false}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 min-h-[75vh]">
        <div className="xl:col-span-1">
          <CommunityChatSidebar
            groups={displayGroups}
            selectedId={selectedId}
            search={search}
            onSearchChange={setSearch}
            onSelectGroup={(id) => setSelectedId(id)}
          />
        </div>
        <div className="xl:col-span-2">
          {selectedGroupUi ? (
            <CommunityChatWindow
              group={selectedGroupUi}
              messages={groupMessagesUi}
              messagesLoading={messagesLoading === "isLoading"}
              draft={draft}
              onDraftChange={setDraft}
              onSend={handleSend}
              onOpenGroupInfo={openInfo}
              sending={sendMessageLoading === "isLoading"}
              sendDisabled={sendDisabled}
              currentUserId={effectiveUserId}
              onEditMessage={openEditForMessage}
              onDeleteMessage={handleDelete}
              onReplyMessage={startReplyToMessage}
              messageActionsDisabled={
                editMessageLoading === "isLoading" ||
                deleteMessageLoading === "isLoading"
              }
              replyingTo={replyingTo}
              onCancelReply={cancelReply}
            />
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
              Select a group to view messages.
            </div>
          )}
        </div>
      </div>

      {selectedGroupUi ? (
        <GroupInfoModal
          open={groupInfoOpen}
          onClose={closeInfo}
          group={selectedGroupUi}
          members={infoModalMembers}
          memberTotal={selectedGroupUi.memberCount}
          estateDisplayName={estateName}
          detailLoading={detailLoading === "isLoading"}
          showMemberAdminTools={false}
          canUpdateGroupProfile={false}
          canDeleteGroup={false}
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
    
      <DeleteModal
        visible={Boolean(messageToDelete)}
        onClose={() => setMessageToDelete(null)}
        itemName="this message"
        title="Delete message"
        onConfirm={handleConfirmDeleteMessage}
      />
    </div>
  );
}

