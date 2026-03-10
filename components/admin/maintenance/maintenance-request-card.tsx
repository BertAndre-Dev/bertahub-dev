"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MapPin, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface MaintenanceRequestCardProps {
  complaint: ComplaintItem;
  estateName?: string;
  isSelected?: boolean;
  onSelect?: () => void;
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
    dispatch(
      getCommentsByComplaint({ complaintId: complaint.id, page: 1, limit: 50 }),
    ).catch(() => {});
  }, [complaint.id, dispatch]);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === complaint.status) return;
    dispatch(updateComplaintStatus({ id: complaint.id, status: newStatus }))
      .unwrap()
      .then(() => toast.success("Status updated"))
      .catch((err: unknown) =>
        toast.error(
          (err as { message?: string })?.message ?? "Failed to update status",
        ),
      );
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
      .catch((err: unknown) =>
        toast.error(
          (err as { message?: string })?.message ?? "Failed to add comment",
        ),
      )
      .finally(() => setSubmittingComment(false));
  };

  const requesterName = getRequesterName(complaint);
  // const location = getAddressDisplay(complaint.addressId);
  // // const locationParts = [location, estateName].filter(Boolean);
  // // const locationLine = locationParts.length > 0 ? locationParts.join : location;
  const ticketDisplay =
    complaint.ticketNumber ||
    `MR-${String(complaint.id).slice(-8).toUpperCase()}`;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow",
        isSelected && "ring-2 ring-primary",
      )}
      onClick={onSelect}
    >
      <CardContent className="p-0">
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {getInitials(requesterName)}
              </div>
              <div>
                <p className="font-semibold text-foreground">{requesterName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(complaint.createdAt)}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {estateName}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-sm font-medium text-muted-foreground shrink-0 pb-2">
                #{ticketDisplay}
              </span>
              <div className="relative min-w-[140px]">
                <Select
                  options={STATUS_OPTIONS_API}
                  value={complaint.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatusChange(e.target.value);
                  }}
                  disabled={updateStatusLoading}
                  className="min-w-[140px] pr-8 text-white border-0 font-medium cursor-pointer"
                  style={{
                    backgroundColor: getStatusStyle(complaint.status),
                  }}
                />
              </div>
            </div>
          </div>

          {/* Title */}
          {complaint.title && (
            <p className="font-semibold text-foreground">{complaint.title}</p>
          )}

          {/* Description */}
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {complaint.description || "No description."}
          </p>

          {/* Comments list */}
          {comments.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground">
                Comments
              </p>
              {comments.map((c) => (
                    <div key={c.id} className="flex p-2 rounded-lg shadow-sm border border-[#E0E0E0] gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border border-[#A1BFE4] font-medium shrink-0">
                    FM
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Facility Manager</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </p>
                    <p className="text-sm text-foreground mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment form */}
          <form
            onSubmit={handleSubmitComment}
            className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1"
              disabled={submittingComment}
            />
            <Button
              type="submit"
              className="cursor-pointer"
              size="sm"
              disabled={submittingComment}
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              {submittingComment ? "..." : "Comment"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
