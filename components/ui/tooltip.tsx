"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

function TooltipProvider({
  delayDuration = 0,
  skipDelayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props} />;
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-max max-w-56 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs leading-snug text-popover-foreground shadow-md",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

type IconTooltipProps = Readonly<{
  label: string;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}>;

/**
 * Hover/focus tooltip for icon-only controls. Portals out of overflow containers
 * and sets an accessible name when the child does not already have one.
 */
function IconTooltip({
  label,
  children,
  side = "top",
  className,
}: IconTooltipProps) {
  const trimmed = label.trim();
  if (!trimmed) return children;

  const child = children as React.ReactElement<{
    "aria-label"?: string;
    "aria-labelledby"?: string;
  }>;
  const hasName = Boolean(
    child.props["aria-label"] || child.props["aria-labelledby"],
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {hasName
          ? child
          : React.cloneElement(child, { "aria-label": trimmed })}
      </TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {trimmed}
      </TooltipContent>
    </Tooltip>
  );
}

export {
  IconTooltip,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
};
