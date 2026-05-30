"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CommunityPageHeader } from "@/components/dashboard/admin/community/CommunityPageHeader";
import { CommunityChatSidebar } from "@/components/dashboard/admin/community/CommunityChatSidebar";
import { CommunityChatWindow } from "@/components/dashboard/admin/community/CommunityChatWindow";
import { GroupInfoModal } from "@/components/dashboard/admin/community/GroupInfoModal";
import {
  chatGroupToCommunity,
  chatGroupMemberRowsFromApi,
} from "@/lib/community-chat-ui";
import { groupMessageToCommunity } from "@/lib/community-chat-map";
import { displayNameFromSignedInUser } from "@/lib/user-display-name";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  clearStaffGroupDetail,
  clearStaffCommunityError,
  clearStaffGroupMessages,
} from "@/redux/slice/staff/community/staff-community-slice";
import {
  deleteStaffGroupMessage,
  editStaffGroupMessage,
  getStaffChatGroupById,
  getStaffChatGroups,
  getStaffGroupMessages,
  sendStaffGroupMessage,
} from "@/redux/slice/staff/community/staff-community-thunks";
import type { ChatGroup, GroupMessageType } from "@/types/community-group";
import type { RootState, AppDispatch } from "@/redux/store";
import Loader from "@/components/ui/Loader";
import { useStaffCommunityChatGroupRoom } from "@/hooks/useStaffCommunityChatGroupRoom";

export default function StaffCommunityChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [draftByGroup, setDraftByGroup] = useState<Record<string, string>>({});
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [messageSelfLabel, setMessageSelfLabel] = useState("You");

  const authToken = useSelector((state: RootState) => state.auth.token);

  useStaffCommunityChatGroupRoom({
    groupId: selectedId,
    token: authToken,
    currentUserId,
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
    const s = state.staffCommunity;
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
        const id =
          typeof (data as { id?: string })?.id === "string"
            ? (data as { id: string }).id
            : typeof (data as { _id?: string })?._id === "string"
              ? (data as { _id: string })._id
              : null;
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
          getStaffChatGroups({
            page: 1,
            limit: 50,
            search: debouncedSearch.trim() || undefined,
          }),
        ).unwrap();
        if (cancelled) return;
        dispatch(clearStaffCommunityError());
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
      dispatch(clearStaffGroupDetail());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await dispatch(getStaffChatGroupById({ groupId: selectedId })).unwrap();
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
      dispatch(clearStaffGroupMessages());
      return;
    }
    dispatch(clearStaffGroupMessages());
    let cancelled = false;
    (async () => {
      try {
        await dispatch(
          getStaffGroupMessages({ groupId: selectedId, page: 1, limit: 50 }),
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
        groupMessageToCommunity(m, currentUserId, messageSelfLabel),
      ),
    [groupMessages, currentUserId, messageSelfLabel],
  );

  const draft = selectedId ? draftByGroup[selectedId] ?? "" : "";

  const handleSend = useCallback(
    async (opts?: { attachments?: string[]; messageType?: GroupMessageType }) => {
      if (!selectedId) return;
      const text = draft.trim();
      const hasAtt = Boolean(opts?.attachments?.length);
      if (!text && !hasAtt) return;
      try {
        await dispatch(
          sendStaffGroupMessage({
            groupId: selectedId,
            content: text,
            messageType: opts?.messageType ?? "text",
            attachments: hasAtt ? opts?.attachments : undefined,
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
        throw e;
      }
    },
    [selectedId, draft, dispatch],
  );

  const handleEditMessage = useCallback(
    (messageId: string) => {
      const current = messages.find((m) => m.id === messageId)?.text ?? "";
      const next = globalThis.prompt("Edit message", current);
      if (next == null || next.trim() === "" || next === current) return;
      void (async () => {
        try {
          await dispatch(
            editStaffGroupMessage({ messageId, content: next.trim() }),
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
          await dispatch(deleteStaffGroupMessage({ messageId })).unwrap();
          toast.success("Message deleted.");
        },
      });
    },
    [dispatch],
  );

  const emptySidebar =
    listLoading !== "isLoading" &&
    displayGroups.length === 0 &&
    !debouncedSearch.trim();

  let emptyPanelTitle = "No group selected.";
  if (listLoading === "isLoading") emptyPanelTitle = "Loading groups…";
  else if (emptySidebar)
    emptyPanelTitle = "You are not in any community groups yet.";

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
          showCreateGroup={false}
          subtitle={`Connect with residents and team members in ${estateName}`}
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
              {!pageLoading && emptySidebar ? (
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  When an admin adds you to a group, it will appear here.
                </p>
              ) : null}
            </div>
          )}
        </div>

        {selectedGroupUi ? (
          <GroupInfoModal
            open={groupInfoOpen}
            onClose={() => setGroupInfoOpen(false)}
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
      </div>
    </div>
  );
}
