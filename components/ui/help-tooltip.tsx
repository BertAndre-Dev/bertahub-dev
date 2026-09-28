"use client";

import { CircleHelp } from "lucide-react";
import { IconTooltip } from "@/components/ui/tooltip";

type Props = {
  text: string;
  label?: string;
};

/** Question-mark hover/focus tooltip for short help copy. */
export function HelpTooltip({ text, label = "More information" }: Readonly<Props>) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  return (
    <IconTooltip label={trimmed}>
      <button
        type="button"
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-[color,transform,background-color] duration-100 ease-out hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
        aria-label={label}
      >
        <CircleHelp className="size-3.5" aria-hidden />
      </button>
    </IconTooltip>
  );
}
