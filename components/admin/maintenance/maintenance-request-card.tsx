"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import type { ComplaintItem, CommentItem, ComplaintResident } from "@/redux/slice/admin/maintenance/complaints-slice";
import {
  getCommentsByComplaint,
  createComment,
  updateComplaintStatus,
} from "@/redux/slice/admin/maintenance/complaints";
import type { AppDispatch, RootState } from "@/redux/store";
import { MAINTENANCE_STATUSES } from "./status-tabs";

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
    "firstName" in complaint.residentId
      ? (complaint.residentId as ComplaintResident)
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
  readonly complaint: ComplaintItem;
  readonly estateName?: string;
  readonly isSelected?: boolean;
  readonly onSelect?: () => void;
}

/** Only statuses allowed by API: pending, in progress, completed, blocked */
const STATUS_OPTIONS = MAINTENANCE_STATUSES.filter((s) => s.value !== "all").map(
  (s) => ({ value: s.value, label: s.label })
);

export function MaintenanceRequestCard({
  complaint,
  estateName = "",
  isSelected,
  onSelect,
}: MaintenanceRequestCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const userId = useSelector((state: RootState) => state.auth?.user?.id ?? state.auth?.user?._id ?? "");
  const comments = useSelector(
    (state: RootState) =>
      (state.complaints as any)?.commentsByComplaintId?.[complaint.id] ?? []
  ) as CommentItem[];
  const updateStatusLoading = useSelector(
    (state: RootState) =>
      (state.complaints as any)?.updateComplaintStatusStatus === "isLoading"
  );

  useEffect(() => {
    dispatch(
      getCommentsByComplaint({ complaintId: complaint.id, page: 1, limit: 50 })
    ).catch(() => {});
  }, [complaint.id, dispatch]);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === complaint.status) return;
    dispatch(
      updateComplaintStatus({ id: complaint.id, status: newStatus })
    )
      .unwrap()
      .then(() => toast.success("Status updated"))
      .catch((err: any) => toast.error(err?.message ?? "Failed to update status"));
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
        userId,
        text,
      })
    )
      .unwrap()
      .then(() => {
        setCommentText("");
        toast.success("Comment added");
      })
      .catch((err: any) => toast.error(err?.message ?? "Failed to add comment"))
      .finally(() => setSubmittingComment(false));
  };

  const requesterName = getRequesterName(complaint);
  const location = getAddressDisplay(complaint.addressId);
  const locationParts = [location, estateName].filter(Boolean);
  const locationLine = locationParts.length > 0 ? locationParts.join(", ") : location;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-0">
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {getInitials(requesterName)}
              </div>
              <div>
                <p className="font-semibold text-foreground">{requesterName}</p>
                <p className="text-sm text-muted-foreground">
                  {locationLine === "—" ? "—" : `• ${locationLine}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(complaint.createdAt)}
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground shrink-0">
              #{complaint.ticketNumber || String(complaint.id).slice(-8).toUpperCase()}
            </span>
          </div>

          {complaint.title && (
            <p className="font-semibold text-foreground">{complaint.title}</p>
          )}
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {complaint.description || "No description."}
          </p>

          <div className="flex flex-wrap items-center justify-between ">
            <span
              className={cn(
                "inline-flex px-3 py-1 rounded-full text-xs font-medium border",
                getPriorityStyle(complaint.priority)
              )}
            >
              {(complaint.priority || "Low").charAt(0).toUpperCase() +
                (complaint.priority || "low").slice(1)}
            </span>
            <div className="relative">
              <Select
                options={STATUS_OPTIONS}
                value={complaint.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updateStatusLoading}
                className="min-w-[140px] pr-8 bg-primary text-primary-foreground border-primary"
              />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground pointer-events-none" />
            </div>
          </div>

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
                          [c.user.firstName, c.user.lastName].filter(Boolean).join(" ")
                        )
                      : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {c.user
                        ? [c.user.firstName, c.user.lastName].filter(Boolean).join(" ")
                        : "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </p>
                    <p className="text-sm text-foreground mt-0.5">{c.text}</p>
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
        </div>
      </CardContent>
    </Card>
  );
}
