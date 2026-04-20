"use client";

import { FileText, X } from "lucide-react";

type Props = {
  fileName?: string;
  fileMimeType?: string;
  onRemove: () => void;
};

export default function ChatFilePreview({
  fileName,
  fileMimeType,
  onRemove,
}: Readonly<Props>) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {fileName || "Attachment"}
          </p>
          {fileMimeType && (
            <p className="text-xs text-muted-foreground truncate">
              {fileMimeType}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded-md hover:bg-muted transition-colors"
        aria-label="Remove attachment"
        title="Remove"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

