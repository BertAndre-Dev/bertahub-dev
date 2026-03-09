"use client";

import type { AnnouncementItem } from "@/redux/slice/admin/announcements/announcements";
import AnnouncementCard, {
  canEditWithinOneHour,
} from "@/components/admin/announcement-card/page";

export interface AnnouncementsListSectionProps {
  loading: boolean;
  announcements: AnnouncementItem[];
  onView?: (item: AnnouncementItem) => void;
  onEdit: (item: AnnouncementItem) => void;
  onDelete: (item: AnnouncementItem) => void;
}

export default function AnnouncementsListSection({
  loading,
  announcements,
  onView,
  onEdit,
  onDelete,
}: AnnouncementsListSectionProps) {
  if (loading) {
    return (
      <p className="text-muted-foreground col-span-2 py-8 text-center">
        Loading announcements...
      </p>
    );
  }
  if (announcements.length === 0) {
    return (
      <p className="text-muted-foreground col-span-2 py-8 text-center rounded-lg border border-border bg-muted/20">
        No announcements yet. Create one to get started.
      </p>
    );
  }
  return (
    <>
      {announcements.map((item) => (
        <AnnouncementCard
          key={item.id}
          announcement={item}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEditWithinOneHour(item.createdAt)}
        />
      ))}
    </>
  );
}
