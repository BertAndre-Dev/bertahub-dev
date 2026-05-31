"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = Readonly<{
  visible: boolean;
  initialContent: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (content: string) => void | Promise<void>;
}>;

export function stripEditedSuffix(text: string): string {
  return text.replace(/\s*\(edited\)\s*$/i, "").trim();
}

export function getCommunityActionError(
  e: unknown,
  fallback: string,
): string {
  if (
    e &&
    typeof e === "object" &&
    "message" in e &&
    typeof (e as { message?: string }).message === "string"
  ) {
    return (e as { message: string }).message;
  }
  return fallback;
}

export default function CommunityEditMessageModal({
  visible,
  initialContent,
  loading = false,
  error = null,
  onClose,
  onSubmit,
}: Props) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (visible) {
      setContent(stripEditedSuffix(initialContent));
    }
  }, [visible, initialContent]);

  const trimmed = content.trim();
  const unchanged =
    trimmed === stripEditedSuffix(initialContent) || trimmed.length === 0;

  return (
    <Modal visible={visible} onClose={onClose} contentClassName="max-w-lg">
      <div className="space-y-4 pr-6">
        <h2 className="text-lg font-semibold text-foreground">Edit message</h2>

        <div className="space-y-2">
          <Label htmlFor="community-edit-message">Message</Label>
          <textarea
            id="community-edit-message"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Update your message"
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || unchanged}
            className="cursor-pointer"
            onClick={() => void onSubmit(trimmed)}
          >
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
