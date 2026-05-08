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
  DUMMY_GROUP_MEMBERS,
  type CommunityMessage,
} from "@/data/community-chat-dummy";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import {
  clearGroupDetail,
  clearCommunityGroupError,
} from "@/redux/slice/community-group/community-group-slice";
import {
  createChatGroup,
  deleteChatGroup,
  getChatGroupById,
  getChatGroups,
  updateChatGroup,
} from "@/redux/slice/community-group/community-group-thunks";
import type { RootState, AppDispatch } from "@/redux/store";

export default function AdminCommunityChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [draftByGroup, setDraftByGroup] = useState<Record<string, string>>({});
  const [extraMessagesByGroup, setExtraMessagesByGroup] = useState<
    Record<string, CommunityMessage[]>
  >({});
  const [createOpen, setCreateOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);

  const { groups, listLoading, createLoading, updateLoading, groupDetail, detailLoading } =
    useSelector((state: RootState) => {
      const s = state.communityGroup;
      return {
        groups: s.groups,
        listLoading: s.listLoading,
        createLoading: s.createLoading,
        updateLoading: s.updateLoading,
        groupDetail: s.groupDetail,
        detailLoading: s.detailLoading,
      };
    });

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
    if (!groupInfoOpen || !selectedId) {
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
  }, [dispatch, groupInfoOpen, selectedId]);

  const displayGroups = useMemo(
    () => groups.map(chatGroupToCommunity),
    [groups],
  );

  const selectedGroupUi = useMemo(() => {
    if (!selectedId) return null;
    const fromDetail =
      groupDetail?._id === selectedId
        ? chatGroupToCommunity(groupDetail)
        : null;
    if (fromDetail) return fromDetail;
    const row = displayGroups.find((g) => g.id === selectedId);
    return row ?? null;
  }, [selectedId, groupDetail, displayGroups]);

  const messages = useMemo(() => {
    if (!selectedId) return [];
    return extraMessagesByGroup[selectedId] ?? [];
  }, [selectedId, extraMessagesByGroup]);

  const draft = selectedId ? draftByGroup[selectedId] ?? "" : "";

  const handleSend = useCallback(() => {
    if (!selectedId) return;
    const text = draft.trim();
    if (!text) return;
    const todayIso = new Date().toISOString().slice(0, 10);
    const newMsg: CommunityMessage = {
      id: `local-${Date.now()}`,
      sender: "You (Facility Manager)",
      text,
      type: "admin",
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      date: todayIso,
    };
    setExtraMessagesByGroup((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), newMsg],
    }));
    setDraftByGroup((prev) => ({ ...prev, [selectedId]: "" }));
  }, [selectedId, draft]);

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

  const emptySidebar =
    !listLoading && displayGroups.length === 0 && !debouncedSearch.trim();

  let emptyPanelTitle = "No group selected.";
  if (listLoading) emptyPanelTitle = "Loading groups…";
  else if (emptySidebar) emptyPanelTitle = "No community groups yet.";

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
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
            draft={draft}
            onDraftChange={(v) =>
              selectedId &&
              setDraftByGroup((prev) => ({ ...prev, [selectedId]: v }))
            }
            onSend={handleSend}
            onOpenGroupInfo={() => setGroupInfoOpen(true)}
          />
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center md:min-h-[calc(100vh-220px)]">
            <p className="text-sm font-medium text-foreground">
              {emptyPanelTitle}
            </p>
            {!listLoading && emptySidebar ? (
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
          members={DUMMY_GROUP_MEMBERS}
          memberTotal={selectedGroupUi.memberCount}
          detailLoading={detailLoading === "isLoading"}
          updateLoading={updateLoading === "isLoading"}
          onUpdateGroup={handleUpdateGroup}
          onExitGroup={() => {
            toast.info("Leaving a community group is not available yet.");
          }}
          onDeleteGroup={handleDeleteGroup}
        />
      ) : null}
    </div>
  );
}
