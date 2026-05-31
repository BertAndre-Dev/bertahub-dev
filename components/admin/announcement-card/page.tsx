"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Pencil, Trash2, Paperclip, Pin, Clock, FileText, FileSpreadsheet, FileType, File } from "lucide-react";
import type { AnnouncementItem } from "@/redux/slice/admin/announcements/announcements";

export interface AnnouncementCardProps {
  readonly announcement: AnnouncementItem;
  readonly onView?: (item: AnnouncementItem) => void;
  readonly onEdit: (item: AnnouncementItem) => void;
  readonly onDelete: (item: AnnouncementItem) => void;
  readonly canEdit: boolean;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

export function canEditWithinOneHour(createdAt?: string): boolean {
  if (!createdAt) return false;
  try {
    return Date.now() - new Date(createdAt).getTime() < ONE_HOUR_MS;
  } catch {
    return false;
  }
}

function formatAnnouncementDate(dateStr?: string) {
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

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-muted text-muted-foreground",
};

/** Pick an icon and label based on file extension */
function getFileInfo(url?: string, name?: string): { Icon: React.ElementType; label: string; ext: string } {
  const raw = name ?? url ?? "";
  const ext = raw.split(".").pop()?.toLowerCase() ?? "";
  if (["xls", "xlsx", "csv"].includes(ext))
    return { Icon: FileSpreadsheet, label: "Spreadsheet", ext: ext.toUpperCase() };
  if (["doc", "docx"].includes(ext))
    return { Icon: FileType, label: "Document", ext: ext.toUpperCase() };
  if (ext === "pdf")
    return { Icon: FileText, label: "PDF", ext: "PDF" };
  return { Icon: File, label: "Attachment", ext: ext.toUpperCase() || "FILE" };
}

/** Compact filename for display */
function shortFileName(url?: string, name?: string): string {
  if (name) return name;
  try {
    const pathname = new URL(url ?? "").pathname;
    return decodeURIComponent(pathname.split("/").pop() ?? url ?? "");
  } catch {
    return url?.split("/").pop() ?? "attachment";
  }
}

export default function AnnouncementCard({
  announcement,
  onView,
  onEdit,
  onDelete,
  canEdit,
}: AnnouncementCardProps) {
  const title = announcement.title ?? "";
  const content = announcement.content ?? announcement.description ?? "";
  const category = announcement.category ?? "General";
  const priority = announcement.priority ?? "low";
  const date =
    announcement.scheduledFor ??
    announcement.createdAt ??
    announcement.updatedAt;

  const hasImage = !!(announcement.imageUrl || announcement.image);
  const fileUrl = announcement.fileUrl || announcement.file;
  const hasFile = !!fileUrl;

  const { Icon: FileIcon, label: fileLabel, ext } = getFileInfo(fileUrl, announcement.fileName);
  const fileName = shortFileName(fileUrl, announcement.fileName);

  const handleCardClick = () => onView?.(announcement);
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(announcement);
  };
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(announcement);
  };

  return (
    <Card
      className="rounded-xl overflow-hidden h-[200px] overflow-y-auto shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* ── Image banner ── */}
      {hasImage && (
        <img
          src={announcement.imageUrl || announcement.image}
          alt={title || "Announcement image"}
          className="w-full h-44 object-cover block"
        />
      )}

      {/* ── Document banner — shown when file present but no image ── */}
      {!hasImage && hasFile && (
        <div className="w-full h-24 bg-muted/50 border-b border-border flex items-center gap-4 px-5">
          <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
            <FileIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
              {fileLabel}
            </p>
            <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
          </div>
          {/* <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded bg-background border border-border text-muted-foreground">
            {ext}
          </span> */}
        </div>
      )}

      <div className="p-4 flex gap-3 flex-1">
        {/* Bell icon — only when no banner of any kind */}
        {!hasImage && !hasFile && (
          <div className="shrink-0 w-9 h-9 rounded-lg bg-[#E6F1FB] flex items-center justify-center self-start mt-0.5">
            <Bell className="w-[18px] h-[18px] text-[#185FA5]" />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E6F1FB] text-[#0C447C]">
              {category}
            </span>
            <span
              className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.low}`}
            >
              {priority}
            </span>
            {announcement.isPinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                <Pin className="w-3 h-3" />
                Pinned
              </span>
            )}
            {hasFile && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                <Paperclip className="w-3 h-3" />
                Attachment
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-heading font-semibold text-[15px] text-foreground leading-snug mt-2">
            {title || "Untitled"}
          </h3>

          {/* Content preview */}
          <div
            className="text-sm text-muted-foreground mt-1.5 line-clamp-3 prose prose-sm max-w-none prose-p:my-0 prose-ul:my-0 prose-ol:my-0"
            dangerouslySetInnerHTML={{
              __html: content || "<span>No content.</span>",
            }}
          />

          {/* Footer */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-3 mt-3 border-t border-border">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {formatAnnouncementDate(date)}
            </span>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                  onClick={handleEditClick}
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
                onClick={handleDeleteClick}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}