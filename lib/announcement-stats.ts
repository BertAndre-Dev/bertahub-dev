import { Megaphone } from "lucide-react";
import type { StatCardItem } from "@/components/admin/announcements/announcements-stats-grid/page";
import type { AnnouncementStats } from "@/redux/slice/admin/announcements/announcements-slice";

export function buildAdminAnnouncementStatsCards(
  stats: AnnouncementStats | null,
  totalFallback = 0,
): StatCardItem[] {
  return [
    {
      label: "Total announcements",
      value: stats?.totalAnnouncements ?? totalFallback,
      icon: Megaphone,
      color: "bg-blue-100 text-blue-700",
    },
  ];
}

export function buildReadOnlyAnnouncementStatsCards(
  total: number,
): StatCardItem[] {
  return [
    {
      label: "Total announcements",
      value: total,
      icon: Megaphone,
      color: "bg-blue-100 text-blue-700",
    },
  ];
}
