"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CheckCheck, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  clearAllNotifications,
  getNotifications,
  markNotificationRead,
  markNotificationsReadMultiple,
  type NotificationItem,
} from "@/redux/slice/notifications/notifications";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import {
  formatNotificationTime,
  resolveNotificationHref,
} from "@/lib/notifications";
import { isBusy, isPending, isSettled } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import DeleteModal from "@/components/resident/delete-modal/page";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
] as const;

const PRIORITY_OPTIONS = [
  { label: "All priorities", value: "" },
  { label: "Low", value: "low" },
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
] as const;

export function NotificationsInbox() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const role = useSelector(selectUserRole);
  const {
    list,
    pagination,
    unreadCount,
    getStatus,
    markMultipleStatus,
    clearAllStatus,
  } = useSelector((state: RootState) => state.notifications);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("");
  const [clearAllOpen, setClearAllOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [status, priority, type]);

  useEffect(() => {
    dispatch(
      getNotifications({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
        priority: priority || undefined,
        type: type.trim() || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, page, status, priority, type]);

  const loading = isPending(getStatus);
  const clearingAll = isBusy(clearAllStatus);
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.pages ?? 1);
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const hasNotifications = total > 0 || list.length > 0;

  const unreadOnPage = useMemo(
    () =>
      list
        .filter((n) => (n.status || "").toLowerCase() === "unread")
        .map((n) => n.id),
    [list],
  );

  const handleOpen = async (item: NotificationItem) => {
    const isUnread = (item.status || "").toLowerCase() === "unread";
    if (isUnread) {
      try {
        await dispatch(markNotificationRead(item.id)).unwrap();
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      }
    }

    const href = resolveNotificationHref(item.actionUrl, role || "admin", {
      estateId: item.estateId,
      relatedEntityId: item.relatedEntityId,
      relatedEntityType: item.relatedEntityType,
    });
    if (!href) return;
    if (/^https?:\/\//i.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  };

  const handleMarkOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await dispatch(markNotificationRead(id)).unwrap();
      toast.success("Marked as read");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleMarkPageRead = async () => {
    if (unreadOnPage.length === 0) return;
    try {
      await dispatch(markNotificationsReadMultiple(unreadOnPage)).unwrap();
      toast.success("Marked page as read");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await dispatch(clearAllNotifications()).unwrap();
      toast.success(res.message || "All notifications cleared");
      setPage(1);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You have no notifications"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={
              unreadOnPage.length === 0 || isBusy(markMultipleStatus)
            }
            onClick={() => void handleMarkPageRead()}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark page as read
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!hasNotifications || clearingAll || loading}
            onClick={() => setClearAllOpen(true)}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-44"
          aria-label="Filter by status"
        />
        <Select
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="sm:w-44"
          aria-label="Filter by priority"
        />
        <input
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Filter by type…"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] sm:max-w-xs"
          aria-label="Filter by type"
        />
      </div>

      {loading && list.length === 0 ? (
        <Loader label="Loading notifications…" />
      ) : isSettled(getStatus) && list.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No notifications found
        </Card>
      ) : (
        <ul className="divide-y rounded-lg border bg-background">
          {list.map((item) => {
            const unread = (item.status || "").toLowerCase() === "unread";
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60",
                  unread && "bg-primary/5",
                )}
              >
                {unread ? (
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent"
                    aria-hidden
                  />
                ) : (
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-transparent"
                    aria-hidden
                  />
                )}
                <button
                  type="button"
                  onClick={() => void handleOpen(item)}
                  className="min-w-0 flex-1 cursor-pointer text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "text-sm text-foreground",
                        unread ? "font-semibold" : "font-medium",
                      )}
                    >
                      {item.title || "Notification"}
                    </p>
                    {item.priority ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {item.priority}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    {item.type ? (
                      <span className="text-[11px] text-muted-foreground">
                        {item.type.replace(/_/g, " ")}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    {item.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNotificationTime(item.createdAt)}
                  </p>
                </button>
                {unread ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs"
                    onClick={(e) => void handleMarkOne(e, item.id)}
                  >
                    Mark read
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {total > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {rangeStart}–{rangeEnd} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canPrev || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canNext || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <DeleteModal
        visible={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        itemName="all notifications"
        title="Clear all notifications"
        message={
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to delete all notifications? This action
            cannot be undone.
          </p>
        }
        confirmLabel="Clear all"
        loadingLabel="Clearing…"
        loading={clearingAll}
        onConfirm={handleClearAll}
      />
    </div>
  );
}
