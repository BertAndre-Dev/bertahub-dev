"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";
import { toast } from "react-toastify";
import ChatFilePreview from "@/components/chat/ChatFilePreview";
import { Input } from "@/components/ui/input";
import type { GroupMessageType } from "@/types/community-group";

export type CommunitySendOptions = Readonly<{
  attachments?: string[];
  messageType: GroupMessageType;
}>;

type Props = Readonly<{
  value: string;
  onChange: (value: string) => void;
  onSend: (opts?: CommunitySendOptions) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
}>;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

export function CommunityMessageInput({
  value,
  onChange,
  onSend,
  placeholder = "Write a message",
  disabled = false,
  sending = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [fileMimeType, setFileMimeType] = useState<string | undefined>(
    undefined,
  );

  const blocked = disabled || sending;
  const canSend = useMemo(
    () => Boolean(value.trim() || fileData),
    [value, fileData],
  );

  const resetAttachment = useCallback(() => {
    setFileData(null);
    setFileName(undefined);
    setFileMimeType(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setFileData(base64);
      setFileName(file.name);
      setFileMimeType(file.type || undefined);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to attach file.";
      toast.error(msg);
    }
  }, []);

  const runSend = useCallback(async () => {
    if (!canSend || blocked) return;
    try {
      await onSend({
        attachments: fileData ? [fileData] : undefined,
        messageType: fileData && !value.trim() ? "file" : "text",
      });
      resetAttachment();
    } catch {
      /* attachment kept; parent handles toast */
    }
  }, [canSend, blocked, fileData, value, onSend, resetAttachment]);

  return (
    <div className="border-t border-border bg-card p-3">
      {fileData ? (
        <div className="mb-2">
          <ChatFilePreview
            fileName={fileName}
            fileMimeType={fileMimeType}
            onRemove={resetAttachment}
          />
        </div>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Attach file"
      />
      <div className="relative flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void runSend();
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
            onClick={handlePickFile}
            disabled={blocked}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            aria-label="Attach file"
          >
            <Paperclip className="size-5 cursor-pointer" />
          </button>
          <button
            type="button"
            onClick={() => void runSend()}
            disabled={blocked || !canSend}
            className="rounded-lg p-2 text-primary hover:bg-primary/10 disabled:opacity-40"
            aria-label="Send message"
          >
            <SendHorizontal className="size-5 cursor-pointer" />
          </button>
        </div>
      </div>
    </div>
  );
}
