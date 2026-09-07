"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { CommentThread } from "@/components/maintenance/comment-thread";
import {
  authorInitials,
  residentIdFromComplaint,
} from "@/lib/maintenance-comments";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  ResidentComplaintItem,
  ResidentCommentItem,
} from "@/redux/slice/resident/maintenance/resident-complaints-slice";
import {
  getCommentsByComplaint,
  createComment,
} from "@/redux/slice/resident/maintenance/resident-complaints";
import type { AppDispatch, RootState } from "@/redux/store";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", bgColor: "#2196F3" },
  { value: "in progress", label: "In progress", bgColor: "#FF9800" },
  { value: "completed", label: "Completed", bgColor: "#4CAF50" },
  { value: "blocked", label: "Blocked", bgColor: "#DC4440" },
];

function getStatusStyle(status?: string) {
  const found = STATUS_OPTIONS.find(
    (s) => s.value === (status || "").toLowerCase(),
  );
  return found?.bgColor ?? "#2196F3";
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRequesterName(complaint: ResidentComplaintItem): string {
  const r =
    complaint.resident ??
    (typeof complaint.residentId === "object" &&
    complaint.residentId !== null &&
    "firstName" in complaint.residentId
      ? complaint.residentId
      : null);
  if (r && typeof r === "object") {
    const name = [r.firstName, r.lastName].filter(Boolean).join(" ").trim();
    if (name) return name;
  }
  return "Requester";
}

interface ResidentComplaintCardProps {
  readonly complaint: ResidentComplaintItem;
  readonly isExpanded?: boolean;
  readonly onToggle?: () => void;
}

export function ResidentComplaintCard({
  complaint,
  isExpanded = false,
  onToggle,
}: ResidentComplaintCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const authUser = useSelector(
    (state: RootState) =>
      state.auth?.user as
        | { id?: string; _id?: string; firstName?: string; lastName?: string }
        | null,
  );
  const userId = authUser?.id ?? authUser?._id ?? "";

  const comments = useSelector((state: RootState) => {
    const s = state.residentComplaints as {
      commentsByComplaintId?: Record<string, ResidentCommentItem[]>;
    };
    return s?.commentsByComplaintId?.[complaint.id] ?? [];
  }) as ResidentCommentItem[];

  useEffect(() => {
    if (complaint.id) {
      dispatch(
        getCommentsByComplaint({
          complaintId: complaint.id,
          page: 1,
          limit: 50,
        }),
      ).catch(() => {});
    }
  }, [complaint.id, dispatch]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !userId) {
      if (!userId) toast.error("You must be signed in to comment");
      return;
    }
    setSubmittingComment(true);
    dispatch(
      createComment({
        complaintId: complaint.id,
        userId: String(userId),
        text,
      }),
    )
      .unwrap()
      .then(() => {
        setCommentText("");
        toast.success("Comment added");
      })
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      })
      .finally(() => setSubmittingComment(false));
  };

  const ticketLabel = `#${complaint.ticketNumber || String(complaint.id).slice(-8).toUpperCase()}`;
  const requesterName = getRequesterName(complaint);

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm",
        "transition-shadow duration-150 ease-out",
        isExpanded && "ring-2 ring-primary/70 shadow-md",
      )}
    >
      <CardContent className="p-0">
        <div className="space-y-4 p-4 sm:p-5">
          <button
            type="button"
            className="w-full cursor-pointer rounded-xl text-left outline-none transition-transform duration-100 ease-out active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:active:scale-100"
            onClick={onToggle}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0150AC]/10 text-sm font-semibold text-[#0150AC] hover:text-[#01408A]">
                  {authorInitials(requesterName) || "R"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em]">
                    {requesterName}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                    {formatDate(complaint.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-[11px] font-medium tabular-nums tracking-wide text-muted-foreground">
                  {ticketLabel}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize text-white"
                  style={{ backgroundColor: getStatusStyle(complaint.status) }}
                >
                  {complaint.status || "—"}
                </span>
              </div>
            </div>

            <p className="mt-3 text-base font-semibold leading-snug tracking-[-0.015em]">
              {complaint.title || "Maintenance request"}
            </p>
            <p
              className={cn(
                "mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap",
                !isExpanded && "line-clamp-3",
              )}
            >
              {complaint.description || "No description."}
            </p>
          </button>

          {isExpanded ? (
            <>
              {comments.length > 0 ? (
                <div className="space-y-3 border-t border-border/70 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Comments · {comments.length}
                  </p>
                  <CommentThread
                    comments={comments}
                    residentId={residentIdFromComplaint(complaint)}
                    formatDate={formatDate}
                  />
                </div>
              ) : null}

              <form
                onSubmit={handleSubmitComment}
                className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 p-1 pl-4"
              >
                <Input
                  type="text"
                  placeholder="Write a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  disabled={submittingComment}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 shrink-0 cursor-pointer rounded-full px-4 active:scale-[0.97]"
                  disabled={submittingComment}
                >
                  {submittingComment ? "Sending" : "Send"}
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}