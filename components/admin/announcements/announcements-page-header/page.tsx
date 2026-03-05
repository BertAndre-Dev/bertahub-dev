"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export interface AnnouncementsPageHeaderProps {
  estateName: string;
  onAddClick: () => void;
  addDisabled?: boolean;
}

export default function AnnouncementsPageHeader({
  estateName,
  onAddClick,
  addDisabled = false,
}: AnnouncementsPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="font-heading text-3xl font-bold">Announcements</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s an overview on{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {estateName}
          </span>
          .
        </p>
      </div>
      <Button
        onClick={onAddClick}
        className="shrink-0 flex items-center gap-2"
        disabled={addDisabled}
      >
        <Plus className="w-4 h-4" />
        Add Announcement
      </Button>
    </div>
  );
}
