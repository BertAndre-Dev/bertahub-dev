"use client";

import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useChatPermissions } from "@/hooks/useChatPermissions";
import type { AppDispatch, RootState } from "@/redux/store";
import { createChat } from "@/redux/slice/chat/chat-thunks";

type Props = {
  open: boolean;
  onClose: () => void;
};

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function getCurrentUserId(state: RootState): string | null {
  const u = state.auth.user as unknown as { _id?: string; id?: string } | null;
  return u?._id ?? u?.id ?? null;
}

function getCurrentEstateId(state: RootState): string | null {
  const u = state.auth.user as unknown as
    | { estateId?: { id?: string; _id?: string } | string | null }
    | null;
  const estate = u?.estateId;
  if (!estate) return null;
  if (typeof estate === "string") return estate;
  return estate.id ?? estate._id ?? null;
}

export default function NewChatModal({ open, onClose }: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const { role, canCreateChat } = useChatPermissions();
  const userId = useSelector(getCurrentUserId);
  const estateIdFromMe = useSelector(getCurrentEstateId);
  const createStatus = useSelector(
    (state: RootState) => state.chat.createChatLoading,
  );

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const busy = createStatus === "isLoading";
  const canSubmit = useMemo(() => {
    return (
      canCreateChat &&
      Boolean(subject.trim()) &&
      Boolean(userId && OBJECT_ID_RE.test(userId))
    );
  }, [canCreateChat, subject, userId]);

  const reset = useCallback(() => {
    setSubject("");
    setDescription("");
  }, []);

  const handleClose = useCallback(() => {
    if (busy) return;
    reset();
    onClose();
  }, [busy, onClose, reset]);

  const handleSubmit = useCallback(async () => {
    if (role === "super-admin" || !canCreateChat) {
      toast.error("You don't have permission to start a new chat.");
      return;
    }
    if (!userId || !OBJECT_ID_RE.test(userId)) {
      toast.error("Invalid user id. Please sign in again.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject is required.");
      return;
    }
    const estateId = estateIdFromMe?.trim() || undefined;
    if (estateId && !OBJECT_ID_RE.test(estateId)) {
      toast.error("Invalid estate id. Please sign in again.");
      return;
    }

    try {
      await dispatch(
        createChat({
          userId,
          subject: subject.trim(),
          description: description.trim() || undefined,
          estateId,
        }),
      ).unwrap();
      toast.success("Chat created.");
      handleClose();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to create chat.";
      toast.error(msg);
    }
  }, [
    role,
    canCreateChat,
    userId,
    subject,
    description,
    estateIdFromMe,
    dispatch,
    handleClose,
  ]);

  return (
    <Modal visible={open} onClose={handleClose}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Start new chat</h3>
          <p className="text-sm text-muted-foreground">
            Create a new support conversation.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="chat-subject" className="text-sm font-medium">
            Subject
          </label>
          <Input
            id="chat-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Payment Issue"
            aria-label="Chat subject"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="chat-description" className="text-sm font-medium">
            Description
          </label>
          <Textarea
            id="chat-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your issue..."
            aria-label="Chat description"
            className="min-h-[120px]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            aria-label="Cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || busy}
            aria-label="Create chat"
          >
            {busy ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
