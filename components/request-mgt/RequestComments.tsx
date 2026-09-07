"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ImagePlus, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-error";
import { isBusy } from "@/lib/async-status";
import { useFileUpload } from "@/hooks/useFileUpload";
import {
  requestCommentAuthorName,
  type RequestCommentItem,
} from "@/lib/request-comments";
import { authorInitials } from "@/lib/maintenance-comments";
import { cn } from "@/lib/utils";
import {
  createRequestComment,
  getRequestComments,
} from "@/redux/slice/request/request-comments";
import { clearRequestComments } from "@/redux/slice/request/request-comments-slice";
import type { AppDispatch, RootState } from "@/redux/store";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

function formatCommentDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function isHttpUrl(src: string) {
  return /^https?:\/\//i.test(src);
}

function CommentImage({
  src,
  alt,
}: Readonly<{ src: string; alt: string }>) {
  const className = "mt-2 max-h-40 w-auto max-w-full rounded-lg object-cover";
  if (isHttpUrl(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={240}
        height={160}
        unoptimized
        className={className}
      />
    );
  }
  return (
    // Data URLs and other non-http sources are not supported by next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}

type RequestCommentThreadProps = Readonly<{
  comments: RequestCommentItem[];
  currentUserId: string;
}>;

function RequestCommentThread({
  comments,
  currentUserId,
}: RequestCommentThreadProps) {
  const ordered = useMemo(
    () =>
      [...comments].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      }),
    [comments],
  );

  return (
    <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
      {ordered.map((comment) => {
        const mine = Boolean(
          currentUserId && comment.userId && comment.userId === currentUserId,
        );
        const name = requestCommentAuthorName(comment);
        const initials = authorInitials(name) || "S";
        const roleLabel = comment.user?.role?.replaceAll("_", " ");

        return (
          <div
            key={comment.id}
            className={cn(
              "flex items-end gap-2",
              mine ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tracking-wide",
                mine ? "bg-[#0150AC] text-white" : "bg-muted text-foreground",
              )}
              aria-hidden
            >
              {initials}
            </div>
            <div
              className={cn(
                "max-w-[min(100%,20rem)] min-w-0 rounded-2xl px-3 py-2",
                mine
                  ? "rounded-br-md bg-[#0150AC] text-white"
                  : "rounded-bl-md bg-muted text-foreground",
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="text-[13px] font-semibold leading-tight tracking-[-0.01em]">
                  {name}
                </p>
                {roleLabel ? (
                  <span
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-wide",
                      mine ? "text-white/75" : "text-muted-foreground",
                    )}
                  >
                    {roleLabel}
                  </span>
                ) : null}
              </div>
              {comment.text ? (
                <p className="mt-1 text-sm leading-snug whitespace-pre-wrap">
                  {comment.text}
                </p>
              ) : null}
              {comment.image ? (
                <CommentImage src={comment.image} alt="Attachment" />
              ) : null}
              {comment.createdAt ? (
                <p
                  className={cn(
                    "mt-1 text-[11px] tabular-nums",
                    mine ? "text-white/70" : "text-muted-foreground",
                  )}
                >
                  {formatCommentDate(comment.createdAt)}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type RequestCommentsProps = Readonly<{
  requestId: string;
  estateId?: string | null;
}>;

export default function RequestComments({
  requestId,
  estateId,
}: RequestCommentsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageUpload = useFileUpload({ kind: "general", accept: "image" });

  const currentUserId = useSelector(
    (state: RootState) =>
      String(state.auth?.user?.id ?? state.auth?.user?._id ?? ""),
  );
  const comments = useSelector(
    (state: RootState) =>
      state.requestComments.commentsByRequestId[requestId] ?? [],
  );
  const { getStatus, createStatus, activeRequestId } = useSelector(
    (state: RootState) => state.requestComments,
  );

  const loadingComments =
    isBusy(getStatus) && activeRequestId === requestId && comments.length === 0;
  const submitting = isBusy(createStatus) || imageUpload.isUploading;

  const resolvedEstateId = estateId?.trim() || undefined;

  useEffect(() => {
    if (!requestId) return;
    dispatch(
      getRequestComments({
        requestId,
        estateId: resolvedEstateId,
        page: 1,
        limit: 50,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });

    return () => {
      dispatch(clearRequestComments(requestId));
    };
  }, [dispatch, requestId, resolvedEstateId]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    imageUpload.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImagePick = async (file: File | undefined) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
    const url = await imageUpload.upload(file);
    if (!url) {
      URL.revokeObjectURL(preview);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!currentUserId) {
      toast.error("You must be signed in to comment");
      return;
    }

    try {
      await dispatch(
        createRequestComment({
          requestId,
          estateId: resolvedEstateId,
          text: trimmed,
          image: imageUpload.fileUrl ?? undefined,
        }),
      ).unwrap();
      setText("");
      clearImage();
      toast.success("Comment added");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  let commentsBody = (
    <p className="text-sm text-muted-foreground">No comments yet.</p>
  );
  if (loadingComments) {
    commentsBody = (
      <p className="text-sm text-muted-foreground">Loading comments...</p>
    );
  } else if (comments.length > 0) {
    commentsBody = (
      <RequestCommentThread
        comments={comments}
        currentUserId={currentUserId}
      />
    );
  }

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <p className="text-sm text-muted-foreground">
        Comments{comments.length ? ` · ${comments.length}` : ""}
      </p>

      {commentsBody}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
        {imagePreview ? (
          <div className="relative inline-flex">
            {/* Blob preview URLs are not valid next/image sources. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt=""
              className="h-16 w-16 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              disabled={submitting}
              className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : null}
        {imageUpload.error ? (
          <p className="text-xs text-destructive">{imageUpload.error}</p>
        ) : null}
        {imageUpload.isUploading ? (
          <p className="text-xs text-muted-foreground">Uploading image…</p>
        ) : null}

        <div className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 p-1 pl-4">
          <Input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            disabled={submitting}
            aria-label="Comment text"
            className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              void handleImagePick(e.target.files?.[0]);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={submitting}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image"
            className="shrink-0 rounded-full"
          >
            <ImagePlus className="size-4" />
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={submitting || !text.trim()}
            className="h-9 shrink-0 cursor-pointer rounded-full px-4"
          >
            <MessageCircle className="size-4" />
            {submitting ? "Sending" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
