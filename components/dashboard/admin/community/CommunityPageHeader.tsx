"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = Readonly<{
  estateName?: string | null;
  onCreateGroup?: () => void;
  showCreateGroup?: boolean;
  subtitle?: string;
}>;

export function CommunityPageHeader({
  estateName,
  onCreateGroup,
  showCreateGroup = true,
  subtitle,
}: Props) {
  const displayEstate = (estateName ?? "").trim() || "your estate";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Community Chat
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {subtitle ?? (
            <>
              Engage with residents in{" "}
              <span className="font-medium text-foreground">
                {displayEstate}
              </span>
            </>
          )}
        </p>
      </div>
      {showCreateGroup && onCreateGroup ? (
        <Button
          type="button"
          onClick={onCreateGroup}
          className="shrink-0 rounded-lg bg-[#0052CC] px-4 text-white hover:bg-[#0047B3]"
        >
          <Plus className="size-4" />
          Create Group Chat
        </Button>
      ) : null}
    </div>
  );
}
