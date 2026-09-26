"use client";

import { useId, useState } from "react";
import { Camera } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";

type ProfilePhotoFieldProps = {
  src?: string | null;
  alt: string;
  /** Called with the hosted public URL from /uploads/user-avatar. */
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function ProfilePhotoField({
  src,
  alt,
  onChange,
  disabled,
}: Readonly<ProfilePhotoFieldProps>) {
  const inputId = useId();
  const { upload, isUploading, error, progress, acceptAttr } = useFileUpload({
    kind: "avatar",
    accept: "image",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const blocked = disabled || isUploading;

  return (
    <div className="flex flex-col items-center gap-2">
      <label
        htmlFor={inputId}
        className={cn(
          "relative cursor-pointer rounded-full",
          "transition-transform duration-100 ease-out active:scale-[0.97]",
          "motion-reduce:transition-none motion-reduce:active:scale-100",
          blocked && "pointer-events-none opacity-60",
        )}
      >
        <UserAvatar
          src={preview || src}
          alt={alt}
          size={88}
          className="shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-2 ring-white dark:ring-zinc-900"
        />
        <span
          className="absolute right-0 bottom-0 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-white dark:ring-zinc-900"
          aria-hidden
        >
          <Camera className="h-3.5 w-3.5" />
        </span>
        <input
          id={inputId}
          type="file"
          accept={acceptAttr}
          className="sr-only"
          disabled={blocked}
          aria-label="Change profile photo"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;

            const localPreview = URL.createObjectURL(file);
            setPreview(localPreview);
            const url = await upload(file);
            URL.revokeObjectURL(localPreview);
            setPreview(null);
            if (url) onChange(url);
          }}
        />
      </label>
      <p className="text-xs tracking-wide text-muted-foreground">
        {isUploading
          ? `Uploading photo…${progress ? ` ${progress}%` : ""}`
          : "Tap to change photo"}
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
