"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_ESTATE_PLACEHOLDER = "your estate";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Shown in the “about” placeholder; falls back to a generic label. */
  estateDisplayName?: string | null;
  isSubmitting?: boolean;
  onCreate?: (payload: {
    name: string;
    description: string;
    profileImage?: string;
  }) => void | Promise<void>;
};

function readFileAsBase64Payload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== "string") {
        reject(new Error("Could not read file."));
        return;
      }
      const i = r.indexOf("base64,");
      resolve(i >= 0 ? r.slice(i + "base64,".length) : r);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function CreateGroupChatModal({
  open,
  onClose,
  estateDisplayName,
  isSubmitting = false,
  onCreate,
}: Props) {
  const [imageLabel, setImageLabel] = useState<string>("");
  const estateLabel =
    (estateDisplayName ?? "").trim() || DEFAULT_ESTATE_PLACEHOLDER;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      <div
        className="relative w-full max-w-md cursor-default rounded-xl bg-card p-6 shadow-xl"
        role="dialog"
        aria-labelledby="create-group-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 flex size-9 cursor-pointer items-center justify-center rounded-full bg-[#d0dff2] text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <h2 id="create-group-title" className="pr-10 text-lg font-bold">
          Create a Group Chat
        </h2>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") ?? "").trim();
            const description = String(fd.get("about") ?? "").trim();
            const raw = fd.get("profileImage");
            const file =
              raw instanceof File && raw.size > 0 ? raw : null;
            let profileImage: string | undefined;
            if (file) {
              profileImage = await readFileAsBase64Payload(file);
            }
            await onCreate?.({ name, description, profileImage });
          }}
        >
          <div>
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              name="name"
              placeholder="Enter group name"
              className="mt-1 h-10 cursor-text rounded-lg"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="group-about">About</Label>
            <Textarea
              id="group-about"
              name="about"
              placeholder={`This group is for all residents in ${estateLabel}`}
              className="mt-1 min-h-[100px] cursor-text rounded-lg"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="group-image">Group image (optional)</Label>
            <Input
              id="group-image"
              name="profileImage"
              type="file"
              accept="image/*"
              className="mt-1 cursor-pointer rounded-lg file:cursor-pointer"
              disabled={isSubmitting}
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                setImageLabel(f ? f.name : "");
              }}
            />
            {imageLabel ? (
              <p className="mt-1 text-xs text-muted-foreground">{imageLabel}</p>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            After the group is created, you can add members from the group info
            panel when your role allows it.
          </p>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-11 w-full rounded-lg bg-[#0052CC] text-white hover:bg-[#0047B3] disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating…" : "Create"}
          </Button>
        </form>
      </div>
    </div>
  );
}
