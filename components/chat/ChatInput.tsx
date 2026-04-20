"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ChatFilePreview from "@/components/chat/ChatFilePreview";
import type { AppDispatch, RootState } from "@/redux/store";
import { sendMessage } from "@/redux/slice/chat/chat-thunks";

type Props = {
  chatId: string;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

export default function ChatInput({ chatId }: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const sendStatus = useSelector(
    (state: RootState) => state.chat.sendMessageLoading,
  );

  const [text, setText] = useState("");
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [fileMimeType, setFileMimeType] = useState<string | undefined>(
    undefined,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const disabled = sendStatus === "isLoading";
  const canSend = useMemo(() => {
    return Boolean(text.trim() || fileData);
  }, [text, fileData]);

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

  const handleSend = useCallback(async () => {
    if (!canSend || disabled) return;
    try {
      await dispatch(
        sendMessage({
          chatId,
          content: text.trim(),
          fileData: fileData ?? undefined,
          fileName,
          fileMimeType,
        }),
      ).unwrap();
      setText("");
      resetAttachment();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to send message.";
      toast.error(msg);
    }
  }, [
    canSend,
    disabled,
    dispatch,
    chatId,
    text,
    fileData,
    fileName,
    fileMimeType,
    resetAttachment,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="border-t bg-background p-4 space-y-3">
      {fileData && (
        <ChatFilePreview
          fileName={fileName}
          fileMimeType={fileMimeType}
          onRemove={resetAttachment}
        />
      )}

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message"
            className="min-h-[48px] max-h-[160px] resize-none rounded-xl"
            aria-label="Message input"
            disabled={disabled}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Attach file"
        />

        <div className="flex items-center gap-2 pb-4">
          {fileData ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={resetAttachment}
              disabled={disabled}
              aria-label="Remove attachment"
              title="Remove attachment"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePickFile}
              disabled={disabled}
              aria-label="Attach file"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="button"
            onClick={handleSend}
            disabled={!canSend || disabled}
            className="rounded-xl"
            aria-label="Send message"
            title="Send"
          >
            <Send className="h-4 w-4 mr-2" />
            {disabled ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}

