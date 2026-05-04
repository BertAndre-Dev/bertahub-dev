"use client";

import { CheckCheck } from "lucide-react";
import type { CommunityMessage } from "@/data/community-chat-dummy";
import { cn } from "@/lib/utils";

type Props = {
  message: CommunityMessage;
};

export function CommunityMessageBubble({ message }: Props) {
  const isAdmin = message.type === "admin";

  return (
    <div
      className={cn(
        "flex gap-2",
        isAdmin ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "mt-5 size-8 shrink-0 rounded-full",
          isAdmin ? "bg-emerald-600" : "bg-[#0052CC]/25",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "flex max-w-[min(100%,28rem)] min-w-0 flex-col",
          isAdmin ? "items-end text-right" : "items-start text-left",
        )}
      >
        <p
          className={cn(
            "mb-1 text-xs font-semibold",
            isAdmin ? "text-emerald-700" : "text-foreground",
          )}
        >
          {message.sender}
        </p>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm shadow-sm",
            isAdmin
              ? "rounded-tr-sm bg-emerald-50 text-foreground dark:bg-emerald-950/40"
              : "rounded-tl-sm bg-muted text-foreground",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-[11px] text-muted-foreground",
              isAdmin ? "justify-end" : "justify-start",
            )}
          >
            <span>{message.time}</span>
            {isAdmin && (
              <CheckCheck className="size-3.5 text-emerald-600" aria-hidden />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
