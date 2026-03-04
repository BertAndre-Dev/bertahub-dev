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
}

function formatAnnouncementDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const suffix =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
          ? "nd"
          : day === 3 || day === 23
            ? "rd"
            : "th";
    return `${day}${suffix} ${d.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    })}`;
  } catch {
    return dateStr;
  }
}

export default function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
}: AnnouncementCardProps) {
  const title = announcement.title ?? "";
  const description = announcement.description ?? "";
  const date =
    announcement.date ?? announcement.createdAt ?? announcement.updatedAt;

  return (
    <Card className="p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow relative">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
          onClick={() => onEdit(announcement)}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
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
          <h3 className="font-heading font-bold text-black uppercase tracking-tight">
            {title || "Untitled"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-4">
            {description || "No description."}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            {formatAnnouncementDate(date)}
          </p>
        </div>
      </div>
    </Card>
  );
}
