"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Check, Paperclip, X } from "lucide-react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/ui/Loader";
import { getApiErrorMessage } from "@/lib/api-error";
import { openAttachmentInNewTab } from "@/lib/download-attachment";
import { isBusy } from "@/lib/async-status";
import type { AppDispatch, RootState } from "@/redux/store";
import { getRequestActorDisplayName } from "@/lib/request-actor";
import {
  getRequestScopeApi,
  type RequestScope,
  type ScopedRequestItem,
  type ScopedRequestStatus,
} from "./request-scope";
import { requestDestructiveOutlineButtonClass } from "./request-action-styles";
import RequestComments from "./RequestComments";
import { RequestRecordDetails } from "./RequestRecordDetails";
import {
  formatRequestStatusLabel,
  getCurrentRequestStep,
  getRequestStatusStyle,
  isUserAssignedToCurrentStep,
  formatStepAssignees,
} from "@/lib/request-record";
import {
  extractSignedInUserEmail,
  extractSignedInUserIds,
} from "@/lib/user-id";

const STATUS_LABELS: Record<ScopedRequestStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
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

function formatCategory(category?: string) {
  if (!category) return "—";
  return category
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatusLabel(status?: ScopedRequestStatus | string) {
  return formatRequestStatusLabel(status);
}

function formatRequestCode(code?: string) {
  const trimmed = code?.trim();
  return trimmed || "—";
}

function getStatusStyle(status?: ScopedRequestStatus | string) {
  return getRequestStatusStyle(status);
}

function getActorName(
  actor?: string | { firstName?: string; lastName?: string; email?: string; name?: string },
) {
  return getRequestActorDisplayName(actor);
}

interface RequestDetailModalProps {
  scope: RequestScope;
  requestId: string | null;
  estateId?: string | null;
  fallback?: ScopedRequestItem | null;
  onClose: () => void;
  onChanged?: () => void;
}

export default function RequestDetailModal({
  scope,
  requestId,
  estateId,
  fallback = null,
  onClose,
  onChanged,
}: RequestDetailModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const api = useMemo(() => getRequestScopeApi(scope), [scope]);
  const [comment, setComment] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { selected, getByIdStatus, decideStatus, cancelStatus } =
    useSelector(api.selectState);
  const signedInUser = useSelector(
    (state: RootState) =>
      (state.auth.user ?? null) as Record<string, unknown> | null,
  );
  const signedInUserIds = extractSignedInUserIds(signedInUser);
  const signedInUserEmail = extractSignedInUserEmail(signedInUser);

  const detailLoading = isBusy(getByIdStatus);
  const deciding = isBusy(decideStatus);
  const cancelling = isBusy(cancelStatus);
  const mutating = deciding || cancelling;

  let item: ScopedRequestItem | null = null;
  if (selected?.id === requestId) item = selected;
  else if (fallback?.id === requestId) item = fallback;
  else item = selected ?? fallback;

  const resolvedEstateId =
    estateId?.trim() || item?.estateId?.trim() || fallback?.estateId?.trim();

  useEffect(() => {
    if (!requestId) return;
    setComment("");
    setConfirmCancel(false);
    dispatch(
      api.getById({
        id: requestId,
        estateId: resolvedEstateId,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });

    return () => {
      dispatch(api.clearSelected());
    };
  }, [api, dispatch, requestId, resolvedEstateId]);

  if (!requestId) return null;

  const assignedToCurrentStep = Boolean(
    item &&
      isUserAssignedToCurrentStep(item, signedInUserIds, signedInUserEmail),
  );
  const canDecide =
    item?.status === "pending_approval" && assignedToCurrentStep;
  const canCancel =
    assignedToCurrentStep &&
    (item?.status === "pending_approval" || item?.status === "draft");
  const currentAssignees = item
    ? formatStepAssignees(getCurrentRequestStep(item))
    : "—";

  const handleApprove = async () => {
    if (!item?.id) return;
    try {
      await dispatch(
        api.decide({
          id: item.id,
          decision: "approve",
          comment: comment.trim() || undefined,
          estateId: resolvedEstateId,
        }),
      ).unwrap();
      toast.success("Request approved.");
      setComment("");
      onChanged?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleReject = async () => {
    if (!item?.id) return;
    const trimmed = comment.trim();
    if (trimmed.length < 3) {
      toast.error("A rejection reason of at least 3 characters is required.");
      return;
    }
    try {
      await dispatch(
        api.decide({
          id: item.id,
          decision: "reject",
          comment: trimmed,
          estateId: resolvedEstateId,
        }),
      ).unwrap();
      toast.success("Request rejected.");
      setComment("");
      onChanged?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleCancel = async () => {
    if (!item?.id) return;
    try {
      await dispatch(
        api.cancel({ id: item.id, estateId: resolvedEstateId }),
      ).unwrap();
      toast.success("Request cancelled.");
      setConfirmCancel(false);
      onChanged?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const showInitialLoader = detailLoading && !item;

  return (
    <Modal
      visible={Boolean(requestId)}
      onClose={onClose}
      contentClassName="max-w-lg w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="relative p-5 sm:p-6 space-y-4">
        {showInitialLoader ? (
          <div className="py-16">
            <Loader label="Loading request..." />
          </div>
        ) : !item ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-muted-foreground">Unable to load this request.</p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold">
                  {item.title || "Request"}
                </h2>
                {item.code ? (
                  <p className="mt-1 text-sm font-medium tracking-[0.02em] text-muted-foreground">
                    {formatRequestCode(item.code)}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(item.createdAt || item.updatedAt)}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${getStatusStyle(item.status)}`}
              >
                {formatStatusLabel(item.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium">{formatCategory(item.category)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created by</p>
                <p className="font-medium">{getActorName(item.createdBy)}</p>
              </div>
              {item.currentStepName || item.currentStepOrder != null ? (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Current step</p>
                  <p className="font-medium">
                    {item.currentStepName ||
                      `Step ${item.currentStepOrder}`}
                  </p>
                  {currentAssignees !== "—" ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentAssignees}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {item.description ? (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{item.description}</p>
              </div>
            ) : null}

            <RequestRecordDetails
              fieldValues={item.fieldValues}
              steps={item.steps}
              currentStepOrder={item.currentStepOrder}
            />

            {item.attachments && item.attachments.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Attachments</p>
                <ul className="space-y-1.5">
                  {item.attachments.map((url, index) => (
                    <li key={`${url.slice(0, 24)}-${index}`}>
                      <button
                        type="button"
                        onClick={() => openAttachmentInNewTab(url)}
                        className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:underline cursor-pointer"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        Attachment {index + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {item.decisions && item.decisions.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Decision history</p>
                <ul className="space-y-2">
                  {item.decisions.map((decision, index) => (
                    <li
                      key={`${decision.decidedAt ?? index}-${decision.decision ?? "d"}`}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium capitalize">
                          {decision.decision?.replaceAll("_", " ") || "Decision"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(decision.decidedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        By {getActorName(decision.decidedBy)}
                      </p>
                      {decision.comment ? (
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {decision.comment}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <RequestComments
              requestId={item.id}
              estateId={resolvedEstateId}
            />

            {canDecide || canCancel || item ? (
              <div className="space-y-3 border-t border-border pt-4">
                {canDecide ? (
                  <div>
                    <Label htmlFor="request-decision-comment">
                      Decision note{" "}
                      <span className="text-muted-foreground font-normal">
                        (required to reject, optional to approve)
                      </span>
                    </Label>
                    <Textarea
                      id="request-decision-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a note or rejection reason..."
                      disabled={mutating}
                      className="min-h-24"
                    />
                  </div>
                ) : null}

                {confirmCancel ? (
                  <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 space-y-3">
                    <p className="text-sm text-[#991B1B]">
                      Cancel this request? This cannot be undone.
                    </p>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                      <Button
                        variant="outline"
                        disabled={mutating}
                        onClick={() => setConfirmCancel(false)}
                      >
                        Keep request
                      </Button>
                      <Button
                        className="bg-[#DC2626] hover:bg-[#B91C1C]"
                        disabled={mutating}
                        onClick={() => void handleCancel()}
                      >
                        Confirm cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    {canCancel ? (
                      <Button
                        variant="outline"
                        className={requestDestructiveOutlineButtonClass}
                        disabled={mutating}
                        onClick={() => setConfirmCancel(true)}
                      >
                        Cancel request
                      </Button>
                    ) : null}
                    {canDecide ? (
                      <>
                        <Button
                          variant="outline"
                          className={requestDestructiveOutlineButtonClass}
                          disabled={mutating}
                          onClick={() => void handleReject()}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          disabled={mutating}
                          onClick={() => void handleApprove()}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}

export {
  formatCategory,
  formatDate,
  formatRequestCode,
  formatStatusLabel,
  getActorName,
  getStatusStyle,
  STATUS_LABELS,
};
