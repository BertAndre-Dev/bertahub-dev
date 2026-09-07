"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

import { useFileUpload } from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";
import {
  isHostedHttpsUrl,
  type FileAcceptKind,
  type UploadKind,
} from "@/lib/uploads/constants";

type FileUploadInputProps = Readonly<{
  value?: string | null;
  onChange?: (url: string | null) => void;
  kind?: UploadKind;
  accept?: FileAcceptKind;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
}>;

function isImageUrl(url: string): boolean {
  if (url.startsWith("data:image/")) return true;
  const path = url.split("?")[0] ?? "";
  return /\.(png|jpe?g|webp|gif)$/i.test(path);
}

export function FileUploadInput({
  value = null,
  onChange,
  kind = "general",
  accept,
  disabled = false,
  label,
  hint,
  className,
}: FileUploadInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const {
    isUploading,
    progress,
    error,
    fileUrl,
    fileName,
    acceptAttr,
    upload,
    reset,
  } = useFileUpload({
    kind,
    accept: accept ?? (kind === "avatar" ? "image" : "general"),
  });

  const displayedUrl = value ?? fileUrl;
  const busy = disabled || isUploading;

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || busy) return;
      const url = await upload(file);
      if (url) onChange?.(url);
    },
    [busy, onChange, upload],
  );

  const clear = () => {
    reset();
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <p className="text-sm font-medium">{label}</p>
      ) : null}

      {displayedUrl ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-2 truncate">
            {isImageUrl(displayedUrl) ? (
              // Hosted or data URLs; next/image is not required for this control.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayedUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded object-cover"
              />
            ) : (
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">
              {fileName ??
                (isHostedHttpsUrl(displayedUrl) ? displayedUrl : "Attached file")}
            </span>
          </span>
          <button
            type="button"
            onClick={clear}
            disabled={busy}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            "block rounded-md border border-dashed border-border px-3 py-4 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "bg-transparent",
            busy ? "pointer-events-none opacity-60" : "cursor-pointer hover:bg-muted/40",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void handleFile(e.dataTransfer.files[0]);
          }}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={acceptAttr}
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <span className="inline-flex items-center justify-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-xs">
            <Paperclip className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Choose file"}
          </span>
          {hint ? (
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Drag and drop or click to upload
            </p>
          )}
        </label>
      )}

      {isUploading ? (
        <progress
          className="h-1.5 w-full"
          value={progress}
          max={100}
        />
      ) : null}

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
