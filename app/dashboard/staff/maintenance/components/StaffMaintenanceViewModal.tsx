"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { MapPin, MessageCircle } from "lucide-react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppDispatch, RootState } from "@/redux/store";
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
  getAddressDisplay,
  getInitials,
  getResidentImage,
  getResidentName,
  getStatusStyle,
  getTicketDisplay,
} from "../lib/format";

type Props = {
  complaintId: string | null;
  estateName?: string;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function StaffMaintenanceViewModal({
  complaintId,
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
    complaint,
    comments,
    loading,
    updateLoading,
    commentLoading,
  } = useSelector((state: RootState) => {
    const maintenance = state.staffMaintenance;
    const current = maintenance.currentComplaint;
    const matchesCurrent = current?.id === complaintId;
    return {
      complaint: matchesCurrent ? current : null,
      comments: complaintId
        ? (maintenance.commentsByComplaintId[complaintId] ?? [])
        : [],
      loading: maintenance.getComplaintByIdStatus === "isLoading",
      updateLoading: maintenance.updateComplaintStatusStatus === "isLoading",
      commentLoading: maintenance.createCommentStatus === "isLoading",
    };
  });

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

  let modalBody: React.ReactNode;
  if (complaint) {
    modalBody = (
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {getTicketDisplay(complaint)}
            </p>
            <h2 className="font-heading text-2xl font-bold mt-1">
              {complaint.title || "Maintenance Request"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <MapPin className="w-4 h-4 shrink-0" />
              {[getAddressDisplay(complaint), estateName]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <select
            value={complaint.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updateLoading}
            aria-label={`Update status for ${complaint.title || "maintenance request"} (${getTicketDisplay(complaint)})`}
            className={`min-w-[160px] rounded-full px-3 py-1.5 text-xs font-semibold border-0 ${getStatusStyle(complaint.status)}`}
          >
            {STAFF_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="font-medium mt-1">
              {formatCategoryLabel(complaint.category)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">Requested By</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-xs font-semibold">
                {requesterImage ? (
                  <Image
                    src={requesterImage}
                    alt={requesterName}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(requesterName)
                )}
              </div>
              <span className="font-medium">{requesterName}</span>
            </div>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">Assigned On</p>
            <p className="font-medium mt-1">
              {formatAssignedOn(complaint.updatedAt || complaint.createdAt)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Description</p>
          <p className="text-sm whitespace-pre-wrap rounded-xl border border-border p-4 bg-muted/20">
            {complaint.description || "No description provided."}
          </p>
        </div>

        {complaint.image && (
          <div>
            <p className="text-sm font-semibold mb-2">Attachment</p>
            <Image
              src={complaint.image}
              alt="Maintenance attachment"
              width={640}
              height={360}
              className="rounded-xl border border-border max-h-72 w-auto object-contain"
            />
          </div>
        )}

        {comments.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Comments</p>
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
        )}

        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            disabled={commentLoading}
          />
          <Button type="submit" disabled={commentLoading}>
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Comment
          </Button>
        </form>
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
    <Modal visible={Boolean(complaintId)} onClose={onClose}>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 md:p-8">
        {modalBody}
      </div>
    </Modal>
  );
}
