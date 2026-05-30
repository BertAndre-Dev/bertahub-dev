"use client";

import type { CommunityChatGroup, CommunityMessage, CommunityReplyTarget } from "@/types/community-chat-ui";
import type { CommunitySendOptions } from "./CommunityMessageInput";
import { CommunityChatHeader } from "./CommunityChatHeader";
import { CommunityMessageList } from "./CommunityMessageList";
import { CommunityMessageInput } from "./CommunityMessageInput";

type Props = Readonly<{
  group: CommunityChatGroup;
  messages: CommunityMessage[];
  messagesLoading?: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (opts?: CommunitySendOptions) => void | Promise<void>;
  onOpenGroupInfo: () => void;
  sendDisabled?: boolean;
  sending?: boolean;
  currentUserId?: string | null;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReplyMessage?: (messageId: string) => void;
  messageActionsDisabled?: boolean;
  replyingTo?: CommunityReplyTarget | null;
  onCancelReply?: () => void;
}>;

export function CommunityChatWindow({
  group,
  messages,
  messagesLoading = false,
  draft,
  onDraftChange,
  onSend,
  onOpenGroupInfo,
  sendDisabled = false,
  sending = false,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
  onReplyMessage,
  messageActionsDisabled,
  replyingTo = null,
  onCancelReply,
}: Props) {
  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm md:min-h-[calc(100vh-220px)]">
      <CommunityChatHeader group={group} onOpenGroupInfo={onOpenGroupInfo} />
      {messagesLoading ? (
        <div className="flex flex-1 items-center justify-center bg-muted/30 py-12 text-sm text-muted-foreground">
          Loading messages…
        </div>
      ) : (
        <CommunityMessageList
          messages={messages}
          currentUserId={currentUserId}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
          onReplyMessage={onReplyMessage}
          messageActionsDisabled={messageActionsDisabled}
        />
      )}
      <CommunityMessageInput
        value={draft}
        onChange={onDraftChange}
        onSend={onSend}
        disabled={sendDisabled}
        sending={sending}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
      />
    </div>
  );
}
