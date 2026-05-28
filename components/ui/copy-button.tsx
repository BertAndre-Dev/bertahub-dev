"use client";

import React from "react";
import { Copy, CheckCircle } from "lucide-react";
import Modal from "@/components/modal/page";

export function CopyButton({
  value,
  label = "",
  copiedLabel = "Copied",
  title,
  copiedMessage,
  className,
}: Readonly<{
  value: string;
  label?: string;
  copiedLabel?: string;
  title?: string;
  /** Optional: overrides the modal success message (e.g. "Visitor code copied"). */
  copiedMessage?: string;
  className?: string;
}>) {
  const [copied, setCopied] = React.useState(false);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);

  const computedCopiedMessage = React.useMemo(() => {
    if (copiedMessage?.trim()) return copiedMessage.trim();
    const source = (title ?? label ?? "").trim();
    if (!source) return "Copied.";
    const lower = source.toLowerCase();
    if (lower.startsWith("copy ")) {
      const rest = source.slice(5).trim();
      if (!rest) return "Copied.";
      return `${rest.charAt(0).toUpperCase()}${rest.slice(1)} copied`;
    }
    return "Copied.";
  }, [copiedMessage, title, label]);

  const onCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setFeedbackOpen(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // No fallback UI required
    }
  };

  React.useEffect(() => {
    if (!feedbackOpen) return;
    const timer = window.setTimeout(() => setFeedbackOpen(false), 5000);
    return () => window.clearTimeout(timer);
  }, [feedbackOpen]);

  return (
    <>
      <button
        type="button"
        onClick={onCopy}
        className={[
          "inline-flex items-center gap-1 rounded py-1 text-xs font-medium cursor-pointer",
          " bg-white hover:bg-muted/30 text-primary cursor-pointer",
          className ?? "",
        ].join(" ")}
        title={title ?? label}
        aria-label={title ?? label}
      >
        {copied ? (
          <>
            <CheckCircle className="h-3.5 w-3.5" />
            {copiedLabel}
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            {label}
          </>
        )}
      </button>

      <Modal
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        contentClassName="md:w-[350px] max-w-[350px] p-4"
      >
        <div className="w-full">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-bold mb-1">Copied</h2>
              <p className="text-sm text-muted-foreground">
                {computedCopiedMessage}
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

