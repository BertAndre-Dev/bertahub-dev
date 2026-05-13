"use client";

import { useMemo } from "react";
import type { CommunityMessage } from "@/types/community-chat-ui";
import { CommunityMessageBubble } from "./CommunityMessageBubble";

function formatSeparatorLabel(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return isoDate;
  const today = new Date();
  const isSameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (isSameDay) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = Readonly<{
  messages: CommunityMessage[];
  currentUserId?: string | null;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  messageActionsDisabled?: boolean;
}>;

export function CommunityMessageList({
  messages,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
  messageActionsDisabled,
}: Props) {
  const sections = useMemo(() => {
    const map = new Map<string, CommunityMessage[]>();
    for (const m of messages) {
      const key = m.date;
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    const orderedDates = [...map.keys()].sort();
    return orderedDates.map((date) => ({
      date,
      label: formatSeparatorLabel(date),
      items: map.get(date) ?? [],
    }));
  }, [messages]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-muted/30 px-3 py-4">
      {sections.map(({ date, label, items }) => (
        <div key={date} className="space-y-4">
          <div className="flex justify-center">
            <span className="rounded-full border border-border bg-background px-4 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              {label}
            </span>
          </div>
          <div className="space-y-4">
            {items.map((msg) => (
              <CommunityMessageBubble
                key={msg.id}
                message={msg}
                currentUserId={currentUserId}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
                messageActionsDisabled={messageActionsDisabled}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
