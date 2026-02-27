"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import type {
  ResidentComplaintItem,
  ResidentCommentItem,
} from "@/redux/slice/resident/maintenance/resident-complaints-slice";
import {
  getCommentsByComplaint,
  createComment,
} from "@/redux/slice/resident/maintenance/resident-complaints";
import type { AppDispatch, RootState } from "@/redux/store";

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

function getPriorityStyle(priority?: string) {
  const key = (priority || "low").toLowerCase();
  return PRIORITY_STYLES[key] ?? PRIORITY_STYLES.low;
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

function getAddressDisplay(addressId?: ResidentComplaintItem["addressId"]): string {
  if (!addressId) return "—";
  if (typeof addressId === "object" && addressId?.data) {
    const parts = Object.values(addressId.data).filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }
  return "—";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

  const userId = useSelector(
    (state: RootState) => state.auth?.user?.id ?? state.auth?.user?._id ?? ""
  );
  const comments = (useSelector((state: RootState) => {
    const s = state.residentComplaints as any;
    return s?.commentsByComplaintId?.[complaint.id] ?? [];
  }) as ResidentCommentItem[]);

  useEffect(() => {
    if (complaint.id) {
      dispatch(
        getCommentsByComplaint({ complaintId: complaint.id, page: 1, limit: 50 })
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
        userId,
        text,
      })
    )
      .unwrap()
      .then(() => {
        setCommentText("");
        toast.success("Comment added");
      })
      .catch((err: any) =>
        toast.error(err?.message ?? "Failed to add comment")
      )
      .finally(() => setSubmittingComment(false));
  };

  const location = getAddressDisplay(complaint.addressId);
  const ticketLabel = `#${complaint.ticketNumber || complaint.id.slice(-8).toUpperCase()}`;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow",
        isExpanded && "ring-2 ring-primary"
      )}
    >
      <CardContent className="p-0">
        <div className="p-5 space-y-4">
          <button
            type="button"
            className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            onClick={onToggle}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {location === "—" ? "—" : `• ${location}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(complaint.createdAt)}
                </p>
              </div>
              <span className="text-sm font-medium text-muted-foreground shrink-0">
                {ticketLabel}
              </span>
            </div>

            <p className="font-semibold text-foreground mt-2">
              {complaint.title || "Maintenance request"}
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap mt-1">
              {complaint.description || "No description."}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={cn(
                  "inline-flex px-3 py-1 rounded-full text-xs font-medium border",
                  getPriorityStyle(complaint.priority)
                )}
              >
                {(complaint.priority || "Low").charAt(0).toUpperCase() +
                  (complaint.priority || "low").slice(1)}
              </span>
              <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                {complaint.status || "—"}
              </span>
            </div>
          </button>

          {isExpanded && (
            <>
              {comments.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground">
                    Comments
                  </p>
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                        {c.user
                          ? getInitials(
                              [c.user.firstName, c.user.lastName]
                                .filter(Boolean)
                                .join(" ")
                            )
                          : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {c.user
                            ? [c.user.firstName, c.user.lastName]
                                .filter(Boolean)
                                .join(" ")
                            : "User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(c.createdAt)}
                        </p>
                        <p className="text-sm text-foreground mt-0.5">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleSubmitComment}
                className="flex gap-2 pt-2 border-t border-border"
              >
                <Input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1"
                  disabled={submittingComment}
                />
                <Button type="submit" size="sm" disabled={submittingComment}>
                  {submittingComment ? "..." : "Comment"}
                </Button>
              </form>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
