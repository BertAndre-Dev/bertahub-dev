"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CommunityChatGroup } from "@/types/community-chat-ui";
import { CommunityChatListItem } from "./CommunityChatListItem";

type Props = {
  groups: CommunityChatGroup[];
  selectedId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectGroup: (id: string) => void;
};

export function CommunityChatSidebar({
  groups,
  selectedId,
  search,
  onSearchChange,
  onSelectGroup,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-card shadow-sm">
      <div className="relative border-b border-border p-3">
        <Input
          type="search"
          placeholder="Search group chats"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 cursor-text rounded-lg border-border bg-muted/40 pr-10"
          aria-label="Search group chats"
        />
        <Search className="pointer-events-none absolute right-6 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No groups match your search.
          </p>
        ) : (
          groups.map((g) => (
            <CommunityChatListItem
              key={g.id}
              group={g}
              active={g.id === selectedId}
              onSelect={() => onSelectGroup(g.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
