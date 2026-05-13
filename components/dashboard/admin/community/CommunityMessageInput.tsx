"use client";

import { Paperclip, SendHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = Readonly<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
}>;

export function CommunityMessageInput({
  value,
  onChange,
  onSend,
  placeholder = "Write a message",
  disabled = false,
  sending = false,
}: Props) {
  const blocked = disabled || sending;
  return (
    <div className="border-t border-border bg-card p-3">
      <div className="relative flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!blocked) onSend();
            }
          }}
          placeholder={placeholder}
          disabled={blocked}
          className="h-11 flex-1 rounded-lg border-border pr-24"
          aria-label="Message text"
        />
        <div className="absolute right-2 flex items-center gap-0.5">
          <button
            type="button"
            disabled={blocked}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            aria-label="Attach file"
          >
            <Paperclip className="size-5" />
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={blocked}
            className="rounded-lg p-2 text-[#0052CC] hover:bg-[#0052CC]/10 disabled:opacity-40"
            aria-label="Send message"
          >
            <SendHorizontal className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
