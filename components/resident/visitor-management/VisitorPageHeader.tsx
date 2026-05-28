"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function VisitorPageHeader({
  onAddVisitor,
  onAddOccupant,
  disabled,
  disabledReason,
}: Readonly<{
  onAddVisitor: () => void;
  onAddOccupant: () => void;
  disabled?: boolean;
  disabledReason?: string;
}>) {
  return (
    <div className="flex flex-col md:flex-row gap-5 md:gap-0 items-start md:items-center justify-between">
      <h1 className="font-heading text-3xl font-bold">Visitor Management</h1>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            disabled={disabled}
            title={disabled ? disabledReason : undefined}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-[180px] rounded-md border bg-white p-1 shadow-md"
          >
            <DropdownMenu.Item
              onSelect={() => onAddVisitor()}
              className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
            >
              Add Visitor
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => onAddOccupant()}
              className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
            >
              Add Occupant
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

