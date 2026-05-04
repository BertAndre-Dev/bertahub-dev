"use client";

import type { CommunityChatGroup, CommunityMessage } from "@/data/community-chat-dummy";
import { CommunityChatHeader } from "./CommunityChatHeader";
import { CommunityMessageList } from "./CommunityMessageList";
import { CommunityMessageInput } from "./CommunityMessageInput";

type Props = {
  group: CommunityChatGroup;
  messages: CommunityMessage[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onOpenGroupInfo: () => void;
};

export function CommunityChatWindow({
  group,
  messages,
  draft,
  onDraftChange,
  onSend,
  onOpenGroupInfo,
}: Props) {
  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm md:min-h-[calc(100vh-220px)]">
      <CommunityChatHeader group={group} onOpenGroupInfo={onOpenGroupInfo} />
      <CommunityMessageList messages={messages} />
      <CommunityMessageInput
        value={draft}
        onChange={onDraftChange}
        onSend={onSend}
      />
    </div>
  );
}
