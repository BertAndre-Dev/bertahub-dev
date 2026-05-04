"use client";

import { useMemo, useState } from "react";
import { CommunityPageHeader } from "@/components/dashboard/admin/community/CommunityPageHeader";
import { CommunityChatSidebar } from "@/components/dashboard/admin/community/CommunityChatSidebar";
import { CommunityChatWindow } from "@/components/dashboard/admin/community/CommunityChatWindow";
import { CreateGroupChatModal } from "@/components/dashboard/admin/community/CreateGroupChatModal";
import { GroupInfoModal } from "@/components/dashboard/admin/community/GroupInfoModal";
import {
  DUMMY_GROUPS,
  DUMMY_GROUP_MEMBERS,
  DUMMY_MESSAGES_BY_GROUP,
  type CommunityMessage,
} from "@/data/community-chat-dummy";

export default function AdminCommunityChatPage() {
  const [selectedId, setSelectedId] = useState<string>(DUMMY_GROUPS[0].id);
  const [search, setSearch] = useState("");
  const [draftByGroup, setDraftByGroup] = useState<Record<string, string>>({});
  const [extraMessagesByGroup, setExtraMessagesByGroup] = useState<
    Record<string, CommunityMessage[]>
  >({});
  const [createOpen, setCreateOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DUMMY_GROUPS;
    return DUMMY_GROUPS.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.lastMsg.toLowerCase().includes(q),
    );
  }, [search]);

  const selectedGroup =
    DUMMY_GROUPS.find((g) => g.id === selectedId) ?? DUMMY_GROUPS[0];

  const messages = useMemo(() => {
    const base = DUMMY_MESSAGES_BY_GROUP[selectedId] ?? [];
    const extra = extraMessagesByGroup[selectedId] ?? [];
    return [...base, ...extra];
  }, [selectedId, extraMessagesByGroup]);

  const draft = draftByGroup[selectedId] ?? "";

  function handleSend() {
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
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <CommunityPageHeader onCreateGroup={() => setCreateOpen(true)} />

      <div className="grid min-h-[560px] grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,340px)_1fr] lg:gap-6">
        <CommunityChatSidebar
          groups={filteredGroups}
          selectedId={selectedId}
          search={search}
          onSearchChange={setSearch}
          onSelectGroup={setSelectedId}
        />
        <CommunityChatWindow
          group={selectedGroup}
          messages={messages}
          draft={draft}
          onDraftChange={(v) =>
            setDraftByGroup((prev) => ({ ...prev, [selectedId]: v }))
          }
          onSend={handleSend}
          onOpenGroupInfo={() => setGroupInfoOpen(true)}
        />
      </div>

      <CreateGroupChatModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <GroupInfoModal
        open={groupInfoOpen}
        onClose={() => setGroupInfoOpen(false)}
        group={selectedGroup}
        members={DUMMY_GROUP_MEMBERS}
        memberTotal={selectedGroup.memberCount}
      />
    </div>
  );
}
