"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MapPin, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { CommentThread } from "@/components/maintenance/comment-thread";
import {
  authorInitials,
  residentIdFromComplaint,
} from "@/lib/maintenance-comments";
import type {
  ComplaintItem,
  CommentItem,
} from "@/redux/slice/admin/maintenance/complaints-slice";
import {
  getCommentsByComplaint,
  createComment,
  updateComplaintStatus,
} from "@/redux/slice/admin/maintenance/complaints";
import type { AppDispatch, RootState } from "@/redux/store";

/** Status options for the update-status API (only these 4 are accepted). */
const STATUS_OPTIONS_API = [
  { value: "pending", label: "Pending", bgColor: "#2196F3" },
  { value: "in progress", label: "In progress", bgColor: "#FF9800" },
  { value: "completed", label: "Completed", bgColor: "#4CAF50" },
  { value: "blocked", label: "Blocked", bgColor: "#DC4440" },
];

function getStatusStyle(status?: string) {
  const found = STATUS_OPTIONS_API.find(
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

function getAddressDisplay(addressId?: ComplaintItem["addressId"]): string {
  if (!addressId) return "—";
  if (typeof addressId === "object" && addressId?.data) {
    const parts = Object.values(addressId.data).filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }
  return "—";
}

function getRequesterName(complaint: ComplaintItem): string {
  const r =
    complaint.resident ??
    (complaint.residentId &&
    typeof complaint.residentId === "object" &&
    "firstName" in (complaint.residentId as object)
      ? (complaint.residentId as { firstName?: string; lastName?: string })
      : null);
  if (r) {
    const name = [r.firstName, r.lastName].filter(Boolean).join(" ").trim();
    if (name) return name;
  }
  return "Requester";
}

interface MaintenanceRequestCardProps {
  readonly complaint: ComplaintItem;
  readonly estateName?: string;
  readonly isSelected?: boolean;
  readonly onSelect?: () => void;
}

export function MaintenanceRequestCard({
  complaint,
  estateName = "",
  isSelected,
  onSelect,
}: MaintenanceRequestCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const userId = useSelector(
    (state: RootState) => state.auth?.user?.id ?? state.auth?.user?._id ?? "",
  );

  const comments = useSelector((state: RootState) => {
    const s = state.complaints as {
      commentsByComplaintId?: Record<string, CommentItem[]>;
    };
    return s?.commentsByComplaintId?.[complaint.id] ?? [];
  }) as CommentItem[];

  const updateStatusLoading = useSelector(
    (state: RootState) =>
      (
        state.complaints as {
          updateComplaintStatusStatus?: string;
        }
      )?.updateComplaintStatusStatus === "isLoading",
  );

  useEffect(() => {
    if (!isSelected) return;
    dispatch(
      getCommentsByComplaint({ complaintId: complaint.id, page: 1, limit: 50 }),
    )
      .unwrap()
      .catch(() => {});
  }, [complaint.id, dispatch, isSelected]);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === complaint.status) return;
    dispatch(updateComplaintStatus({ id: complaint.id, status: newStatus }))
      .unwrap()
      .then(() => toast.success("Status updated"))
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  };

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

  const requesterName = getRequesterName(complaint);
  const addressLine = getAddressDisplay(complaint.addressId);
  const locationLine = [addressLine !== "—" ? addressLine : null, estateName]
    .filter(Boolean)
    .join(" · ");
  const ticketDisplay =
    complaint.ticketNumber ||
    `MR-${String(complaint.id).slice(-8).toUpperCase()}`;

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm",
        "transition-[box-shadow,transform] duration-150 ease-out",
        isSelected && "ring-2 ring-primary/70 shadow-md",
      )}
    >
      <CardContent className="p-0">
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={onSelect}
              aria-expanded={isSelected}
              className="flex min-w-0 flex-1 cursor-pointer flex-col text-left outline-none transition-transform duration-100 ease-out active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:active:scale-100"
            >
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
                  {locationLine ? (
                    <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{locationLine}</span>
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {complaint.title ? (
                  <p className="text-base font-semibold leading-snug tracking-[-0.015em]">
                    {complaint.title}
                  </p>
                ) : null}
                <p
                  className={cn(
                    "text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap",
                    !isSelected && "line-clamp-3",
                  )}
                >
                  {complaint.description || "No description."}
                </p>
              </div>
            </button>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-[11px] font-medium tabular-nums tracking-wide text-muted-foreground">
                #{ticketDisplay}
              </span>
              <Select
                options={STATUS_OPTIONS_API}
                value={complaint.status}
                onChange={(e) => {
                  e.stopPropagation();
                  handleStatusChange(e.target.value);
                }}
                disabled={updateStatusLoading}
                className="min-w-34 cursor-pointer rounded-full border-0 pr-8 text-xs font-semibold text-white"
                style={{
                  backgroundColor: getStatusStyle(complaint.status),
                }}
              />
            </div>
          </div>

          {isSelected ? (
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
                  className="h-9 shrink-0 cursor-pointer rounded-full px-4 active:scale-[0.97]"
                  size="sm"
                  disabled={submittingComment}
                >
                  <MessageCircle className="size-4" />
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
