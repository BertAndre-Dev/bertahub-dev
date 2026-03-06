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

function getAddressDisplay(
  addressId?: ResidentComplaintItem["addressId"],
): string {
  if (!addressId) return "—";
  if (typeof addressId === "object" && addressId?.data) {
    const parts = Object.values(addressId.data).filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }
  return "—";
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

  const userId = useSelector(
    (state: RootState) => state.auth?.user?.id ?? state.auth?.user?._id ?? "",
  );

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
      .catch((err: unknown) =>
        toast.error(
          (err as { message?: string })?.message ?? "Failed to add comment",
        ),
      )
      .finally(() => setSubmittingComment(false));
  };

  // const location = getAddressDisplay(complaint.addressId);
  const ticketLabel = `#${complaint.ticketNumber || String(complaint.id).slice(-8).toUpperCase()}`;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow",
        isExpanded && "ring-2 ring-primary",
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
                  {getRequesterName(complaint)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(complaint.createdAt)}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-medium text-muted-foreground shrink-0">
                  {ticketLabel}
                </span>
                <span
                  className="text-xs font-medium text-white rounded-lg p-2"
                  style={{ backgroundColor: getStatusStyle(complaint.status) }}
                >
                  {complaint.status || "—"}
                </span>
              </div>
            </div>

            <p className="font-semibold text-foreground mt-2">
              {complaint.title || "Maintenance request"}
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap mt-1">
              {complaint.description || "No description."}
            </p>
          </button>

          {isExpanded && (
            <>
              {comments.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground">
                    Comments
                  </p>
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="flex p-2 rounded-lg shadow-sm border border-[#E0E0E0] gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border border-[#A1BFE4] font-medium shrink-0">
                        FM
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Facility Manager</p>
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