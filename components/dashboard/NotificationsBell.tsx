"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell } from "lucide-react";
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "@/redux/store";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import {
  getNotifications,
  markNotificationRead,
  type NotificationItem,
} from "@/redux/slice/notifications/notifications";
import {
  formatNotificationTime,
  getNotificationsInboxPath,
  resolveNotificationHref,
} from "@/lib/notifications";
import { isPending, isSettled } from "@/lib/async-status";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 10;

function isNotificationsDisabledRole(
  role: string | null | undefined,
): boolean {
  const normalized = (role || "").toLowerCase().trim();
  return normalized === "super admin" || normalized === "company";
}

export function NotificationsBell() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const role = useSelector(selectUserRole);
  const inboxPath = getNotificationsInboxPath(role);
  const { list, unreadCount, getStatus } = useSelector(
    (state: RootState) => state.notifications,
  );
  const [open, setOpen] = useState(false);
  const fetchedOnce = useRef(false);
  const enabled = !isNotificationsDisabledRole(role);

  const fetchPreview = useCallback(() => {
    if (!enabled) return;
    dispatch(getNotifications({ page: 1, limit: PREVIEW_LIMIT })).catch(
      () => undefined,
    );
  }, [dispatch, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    fetchPreview();
  }, [enabled, fetchPreview]);

  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => fetchPreview();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, fetchPreview]);

  useEffect(() => {
    if (!enabled) return;
    if (open) fetchPreview();
  }, [enabled, open, fetchPreview]);

  if (!enabled) return null;

  const handleItemClick = async (item: NotificationItem) => {
    setOpen(false);
    const isUnread = (item.status || "").toLowerCase() === "unread";
    if (isUnread) {
      try {
        await dispatch(markNotificationRead(item.id)).unwrap();
      } catch (err: unknown) {
        toast.error(
          (err as string) || "Failed to mark notification as read",
        );
      }
    }

    const href = resolveNotificationHref(item.actionUrl, role, {
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

  const loading = isPending(getStatus) && list.length === 0;

  let listBody: ReactNode;
  if (loading) {
    listBody = (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        Loading…
      </p>
    );
  } else if (isSettled(getStatus) && list.length === 0) {
    listBody = (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        No notifications yet
      </p>
    );
  } else {
    listBody = list.map((item) => {
      const unread = (item.status || "").toLowerCase() === "unread";
      return (
        <DropdownMenu.Item
          key={item.id}
          onSelect={(e) => {
            e.preventDefault();
            void handleItemClick(item);
          }}
          className={cn(
            "cursor-pointer select-none border-b border-border/60 px-3 py-2.5 outline-none last:border-b-0",
            "hover:bg-muted focus:bg-muted",
            unread && "bg-primary/5",
          )}
        >
          <div className="flex items-start gap-2">
            {unread ? (
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
                aria-hidden
              />
            ) : (
              <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm text-foreground",
                  unread ? "font-semibold" : "font-medium",
                )}
              >
                {item.title || "Notification"}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {item.message}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatNotificationTime(item.createdAt)}
              </p>
            </div>
          </div>
        </DropdownMenu.Item>
      );
    });
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title="Notifications"
          className="relative rounded-lg p-2 transition-colors hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-lg border bg-background shadow-lg"
        >
          <div className="flex items-center justify-between border-b px-3 py-2.5">
            <p className="text-sm font-semibold text-foreground">
              Notifications
            </p>
            {unreadCount > 0 ? (
              <span className="text-xs text-muted-foreground">
                {unreadCount} unread
              </span>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">{listBody}</div>

          <div className="border-t px-3 py-2">
            <Link
              href={inboxPath}
              onClick={() => setOpen(false)}
              className="block w-full rounded-md py-1.5 text-center text-sm font-medium text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
