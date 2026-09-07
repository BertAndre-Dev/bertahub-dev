"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

import type { MultiFileUploadItem } from "@/hooks/useMultiFileUpload";
import { cn } from "@/lib/utils";

type MultiFileUploadInputProps = Readonly<{
  items: MultiFileUploadItem[];
  onAddFiles: (files: File[]) => void | Promise<string[]>;
  onRemove: (id: string) => void;
  acceptAttr: string;
  maxFiles: number;
  isUploading?: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
}>;

export function MultiFileUploadInput({
  items,
  onAddFiles,
  onRemove,
  acceptAttr,
  maxFiles,
  isUploading = false,
  disabled = false,
  label,
  hint,
  className,
}: MultiFileUploadInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const atLimit =
    items.filter((item) => item.status !== "failed").length >= maxFiles;
  const busy = disabled || atLimit;

  const handleFiles = useCallback(
    (files: File[]) => {
      if (!files.length || busy) return;
      void onAddFiles(files);
    },
    [busy, onAddFiles],
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <p className="text-sm font-medium">{label}</p> : null}

      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{item.name}</span>
                  {item.status === "uploading" ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.progress}%
                    </span>
                  ) : null}
                  {item.status === "failed" ? (
                    <span className="shrink-0 text-xs text-destructive">
                      Failed
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  disabled={disabled || item.status === "uploading"}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted"
                  aria-label={`Remove ${item.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {item.status === "uploading" ? (
                <progress
                  className="mt-2 h-1.5 w-full"
                  value={item.progress}
                  max={100}
                />
              ) : null}
              {item.error ? (
                <p className="mt-1 text-xs text-destructive">{item.error}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

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
          handleFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={acceptAttr}
          multiple
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            handleFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <span className="inline-flex items-center justify-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-xs">
          <Paperclip className="h-4 w-4" />
          {isUploading ? "Uploading..." : "Add files"}
        </span>
        <p className="mt-2 text-xs text-muted-foreground">
          {hint ?? `Up to ${maxFiles} files. Drag and drop or click to upload.`}
        </p>
      </label>
    </div>
  );
}
