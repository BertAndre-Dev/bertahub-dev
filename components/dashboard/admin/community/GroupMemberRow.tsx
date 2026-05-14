"use client";

import { ShieldPlus, Trash2 } from "lucide-react";
import type { CommunityMember } from "@/types/community-chat-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  member: CommunityMember;
  showActions?: boolean;
  actionsDisabled?: boolean;
  onRemoveMember?: (userId: string) => void;
  onPromoteMember?: (userId: string) => void;
}>;

export function GroupMemberRow({
  member,
  showActions = false,
  actionsDisabled = false,
  onRemoveMember,
  onPromoteMember,
}: Props) {
  const initials = member.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 border-b border-border/60 py-3 last:border-b-0">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
          member.avatarColor === "green" ? "bg-emerald-600" : "bg-gray-400",
        )}
        aria-hidden
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {member.subtitle}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
          member.tag === "Admin"
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
            : "bg-muted text-muted-foreground",
        )}
      >
        {member.tag}
      </span>
      {showActions ? (
        <div className="flex shrink-0 items-center gap-1">
          {member.tag !== "Admin" && onPromoteMember ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 cursor-pointer text-muted-foreground hover:text-primary disabled:cursor-not-allowed"
              disabled={actionsDisabled}
              aria-label={`Make ${member.name} a group admin`}
              title="Make group admin"
              onClick={() => onPromoteMember(member.id)}
            >
              <ShieldPlus className="size-4" />
            </Button>
          ) : null}
          {onRemoveMember ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 cursor-pointer text-muted-foreground hover:text-destructive disabled:cursor-not-allowed"
              disabled={actionsDisabled}
              aria-label={`Remove ${member.name} from group`}
              title="Remove from group"
              onClick={() => onRemoveMember(member.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
