"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Calendar,
  Mail,
  MapPin,
  MessageCircle,
  User,
  Wrench,
} from "lucide-react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppDispatch, RootState } from "@/redux/store";
import type { StaffComplaintItem } from "@/redux/slice/staff/maintenance/staff-maintenance-slice";
import {
  createStaffComplaintComment,
  getStaffComplaintById,
  getStaffComplaintComments,
  updateStaffComplaintStatus,
} from "@/redux/slice/staff/maintenance/staff-maintenance";
import {
  STAFF_STATUS_OPTIONS,
  formatAssignedOn,
  formatCategoryLabel,
  formatStatusLabel,
  getAddressDisplay,
  getAssignedToEmail,
  getAssignedToName,
  getInitials,
  getResidentEmail,
  getResidentImage,
  getResidentName,
  getStatusStyle,
  getTicketDisplay,
} from "../lib/format";

type Props = {
  complaintId: string | null;
  initialComplaint?: StaffComplaintItem | null;
  estateName?: string;
  onClose: () => void;
  onUpdated?: () => void;
};

function InfoCard({
  label,
  value,
  icon: Icon,
}: Readonly<{
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}>) {
  return (
    <div className="rounded-xl border border-border p-4 bg-muted/5">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        {Icon ? <Icon className="w-3.5 h-3.5 shrink-0" /> : null}
        {label}
      </p>
      <div className="font-medium mt-1.5 text-sm text-foreground break-words">
        {value}
      </div>
    </div>
  );
}

export default function StaffMaintenanceViewModal({
  complaintId,
  initialComplaint = null,
  estateName = "",
  onClose,
  onUpdated,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [commentText, setCommentText] = useState("");

  const userId = useSelector(
    (state: RootState) => state.auth.user?.id ?? state.auth.user?._id ?? "",
  );

  const {
    fetchedComplaint,
    comments,
    loading,
    updateLoading,
    commentLoading,
  } = useSelector((state: RootState) => {
    const maintenance = state.staffMaintenance;
    const current = maintenance.currentComplaint;
    const matchesCurrent = current?.id === complaintId;
    return {
      fetchedComplaint: matchesCurrent ? current : null,
      comments: complaintId
        ? (maintenance.commentsByComplaintId[complaintId] ?? [])
        : [],
      loading: maintenance.getComplaintByIdStatus === "isLoading",
      updateLoading: maintenance.updateComplaintStatusStatus === "isLoading",
      commentLoading: maintenance.createCommentStatus === "isLoading",
    };
  });

  const complaint = useMemo(() => {
    if (fetchedComplaint?.id === complaintId) return fetchedComplaint;
    if (initialComplaint?.id === complaintId) return initialComplaint;
    return fetchedComplaint ?? initialComplaint;
  }, [complaintId, fetchedComplaint, initialComplaint]);

  useEffect(() => {
    if (!complaintId) return;
    dispatch(getStaffComplaintById(complaintId)).catch((err: unknown) =>
      toast.error(
        (err as { message?: string })?.message ?? "Failed to load request.",
      ),
    );
    dispatch(
      getStaffComplaintComments({ complaintId, page: 1, limit: 50 }),
    ).catch(() => {});
  }, [complaintId, dispatch]);

  const handleStatusChange = async (newStatus: string) => {
    if (!complaint || newStatus === complaint.status) return;
    try {
      await dispatch(
        updateStaffComplaintStatus({ id: complaint.id, status: newStatus }),
      ).unwrap();
      toast.success("Status updated");
      onUpdated?.();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to update status",
      );
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !complaintId) return;
    if (!userId) {
      toast.error("You must be signed in to comment");
      return;
    }
    try {
      await dispatch(
        createStaffComplaintComment({
          complaintId,
          userId: String(userId),
          text,
        }),
      ).unwrap();
      setCommentText("");
      toast.success("Comment added");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ?? "Failed to add comment",
      );
    }
  };

  const requesterName = complaint ? getResidentName(complaint) : "Resident";
  const requesterImage = complaint ? getResidentImage(complaint) : undefined;
  const locationLine = complaint
    ? [getAddressDisplay(complaint), estateName].filter((p) => p && p !== "—").join(" · ") ||
      estateName ||
      "—"
    : "—";

  let modalBody: React.ReactNode;
  if (complaint) {
    modalBody = (
      <div className="space-y-6 max-h-[min(80vh,720px)] overflow-y-auto pr-1">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary">
              {getTicketDisplay(complaint)}
            </p>
            <h2 className="font-heading text-xl sm:text-2xl font-bold mt-1 break-words">
              {complaint.title || "Maintenance Request"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{locationLine}</span>
            </p>
          </div>
          <select
            value={complaint.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updateLoading}
            aria-label={`Update status for ${complaint.title || "maintenance request"} (${getTicketDisplay(complaint)})`}
            className={`shrink-0 min-w-[140px] rounded-full px-3 py-2 text-xs font-semibold border-0 cursor-pointer ${getStatusStyle(complaint.status)}`}
          >
            {STAFF_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {complaint.image ? (
          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              Issue photo
            </p>
            <div className="rounded-xl border border-border overflow-hidden bg-muted/20">
              <Image
                src={complaint.image}
                alt={complaint.title ?? "Maintenance issue photo"}
                width={800}
                height={450}
                className="w-full max-h-80 object-contain"
                unoptimized
              />
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard
            label="Category"
            value={formatCategoryLabel(complaint.category)}
          />
          <InfoCard
            label="Status"
            value={formatStatusLabel(complaint.status)}
          />
          <InfoCard
            label="Submitted"
            icon={Calendar}
            value={formatAssignedOn(complaint.createdAt)}
          />
          <InfoCard
            label="Last updated"
            icon={Calendar}
            value={formatAssignedOn(complaint.updatedAt)}
          />
        </div>

        <div className="rounded-xl border border-border p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Requested by
          </p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-sm font-semibold shrink-0">
              {requesterImage ? (
                <Image
                  src={requesterImage}
                  alt={requesterName}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                getInitials(requesterName)
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{requesterName}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 break-all">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {getResidentEmail(complaint)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Assigned to
          </p>
          <p className="font-semibold">{getAssignedToName(complaint)}</p>
          {getAssignedToEmail(complaint) !== "—" ? (
            <p className="text-sm text-muted-foreground break-all">
              {getAssignedToEmail(complaint)}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Description</p>
          <p className="text-sm whitespace-pre-wrap rounded-xl border border-border p-4 bg-muted/20 text-foreground">
            {complaint.description || "No description provided."}
          </p>
        </div>

        {comments.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Comments ({comments.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-xl border border-border p-3 bg-muted/10"
                >
                  <p className="text-xs text-muted-foreground">
                    {formatAssignedOn(comment.createdAt)}
                  </p>
                  <p className="text-sm mt-1">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}

        <form onSubmit={handleSubmitComment} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            disabled={commentLoading}
            aria-label="Comment text"
          />
          <Button
            type="submit"
            disabled={commentLoading}
            className="shrink-0"
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Comment
          </Button>
        </form>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  } else if (loading) {
    modalBody = (
      <p className="text-center text-muted-foreground py-10">
        Loading maintenance request...
      </p>
    );
  } else {
    modalBody = (
      <p className="text-center text-muted-foreground py-10">
        Maintenance request not found.
      </p>
    );
  }

  return (
    <Modal
      visible={Boolean(complaintId)}
      onClose={onClose}
      contentClassName="max-w-3xl w-full max-h-[90vh] overflow-hidden"
    >
      <div className="p-4 sm:p-6">{modalBody}</div>
    </Modal>
  );
}
