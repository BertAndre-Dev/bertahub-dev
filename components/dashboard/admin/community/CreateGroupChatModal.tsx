"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  COMMUNITY_ESTATE_NAME,
  DUMMY_RESIDENT_OPTIONS,
} from "@/data/community-chat-dummy";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Dummy submit — replace with API call later */
  onCreate?: (payload: {
    name: string;
    about: string;
    addAllResidents: boolean;
    residentScope: string;
  }) => void;
};

export function CreateGroupChatModal({
  open,
  onClose,
  onCreate,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-card p-6 shadow-xl"
        role="dialog"
        aria-labelledby="create-group-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[#d0dff2] text-gray-700 transition-colors hover:bg-gray-200"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <h2 id="create-group-title" className="pr-10 text-lg font-bold">
          Create a Group Chat
        </h2>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onCreate?.({
              name: String(fd.get("name") ?? ""),
              about: String(fd.get("about") ?? ""),
              addAllResidents: fd.get("addAll") === "on",
              residentScope: String(fd.get("residents") ?? ""),
            });
            onClose();
          }}
        >
          <div>
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              name="name"
              placeholder="Enter group name"
              className="mt-1 h-10 rounded-lg"
              required
            />
          </div>
          <div>
            <Label htmlFor="group-about">About</Label>
            <Textarea
              id="group-about"
              name="about"
              placeholder={`This group is for all residents in ${COMMUNITY_ESTATE_NAME}`}
              className="mt-1 min-h-[100px] rounded-lg"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="addAll"
              className="size-4 rounded border-input accent-[#0052CC]"
            />
            Add all residents
          </label>
          <div>
            <Label htmlFor="select-residents">Select residents</Label>
            <Select
              id="select-residents"
              name="residents"
              options={DUMMY_RESIDENT_OPTIONS}
              className="mt-1 h-10 rounded-lg"
            />
          </div>
          <Button
            type="submit"
            className="mt-2 h-11 w-full rounded-lg bg-[#0052CC] text-white hover:bg-[#0047B3]"
          >
            Create
          </Button>
        </form>
      </div>
    </div>
  );
}
