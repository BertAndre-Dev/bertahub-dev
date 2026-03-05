"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Pencil, Trash2 } from "lucide-react";
import type { AnnouncementItem } from "@/redux/slice/admin/announcements/announcements";

export interface AnnouncementCardProps {
  readonly announcement: AnnouncementItem;
  readonly onEdit: (item: AnnouncementItem) => void;
  readonly onDelete: (item: AnnouncementItem) => void;
  readonly canEdit: boolean;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

export function canEditWithinOneHour(createdAt?: string): boolean {
  if (!createdAt) return false;
  try {
    const created = new Date(createdAt).getTime();
    return Date.now() - created < ONE_HOUR_MS;
  } catch {
    return false;
  }
}

function formatAnnouncementDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-GB", {
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

export default function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  canEdit,
}: AnnouncementCardProps) {
  const title = announcement.title ?? "";
  const content = announcement.content ?? announcement.description ?? "";
  const date =
    announcement.scheduledFor ??
    announcement.createdAt ??
    announcement.updatedAt;
  const category = announcement.category ?? "—";
  const priority = announcement.priority ?? "—";

  return (
    <Card className="p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow relative">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
            onClick={() => onEdit(announcement)}
            title="Edit (within 1 hour of creation)"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(announcement)}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-3 pr-20">
        <div className="p-2 rounded-lg bg-[#D0DFF280] shrink-0 h-fit">
          <Bell className="w-5 h-5 text-[#0150AC]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {category}
            </span>
            <span className="text-xs text-muted-foreground">· {priority}</span>
            {announcement.isPinned && (
              <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                Pinned
              </span>
            )}
          </div>
          <h3 className="font-heading font-bold text-black uppercase tracking-tight mt-1">
            {title || "Untitled"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-4">
            {content || "No content."}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            {formatAnnouncementDate(date)}
          </p>
        </div>
      </div>
    </Card>
  );
}
