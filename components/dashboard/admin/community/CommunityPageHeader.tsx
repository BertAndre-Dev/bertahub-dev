"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMMUNITY_ESTATE_NAME } from "@/data/community-chat-dummy";

type Props = Readonly<{
  onCreateGroup?: () => void;
  /** When false, hide the create button (e.g. resident view). Default true. */
  showCreateGroup?: boolean;
  /** Override default subtitle line. */
  subtitle?: string;
}>;

export function CommunityPageHeader({
  onCreateGroup,
  showCreateGroup = true,
  subtitle,
}: Props) {
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
                {COMMUNITY_ESTATE_NAME}
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
