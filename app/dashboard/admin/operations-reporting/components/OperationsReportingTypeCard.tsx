"use client";

import React from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
  children?: React.ReactNode;
};

export default function OperationsReportingTypeCard({
  title,
  description,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  deleteDisabled = false,
  children,
}: Readonly<Props>) {
  const titleContent = (
    <>
      <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">No description</p>
      )}
    </>
  );

  const headerToggleClassName = "min-w-0 flex-1 cursor-pointer text-left";

  return (
    <Card className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        {expanded ? (
          <button
            type="button"
            onClick={onToggle}
            className={headerToggleClassName}
            aria-expanded="true"
          >
            {titleContent}
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className={headerToggleClassName}
            aria-expanded="false"
          >
            {titleContent}
          </button>
        )}

        <div className="flex shrink-0 items-center gap-1">
          {expanded ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={onToggle}
              aria-expanded="true"
              aria-label="Collapse"
            >
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={onToggle}
              aria-expanded="false"
              aria-label="Expand"
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-[#0150AC]"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-destructive"
            disabled={deleteDisabled}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-4 pb-5 pt-4 sm:px-5">{children}</div>
        </div>
      </div>
    </Card>
  );
}
