"use client";

import { useMemo } from "react";

import type { ChatStatus } from "@/types/chat";

type Props = {
  status: ChatStatus;
};

export default function ChatStatusBadge({ status }: Readonly<Props>) {
  const { label, className } = useMemo(() => {
    switch (status) {
      case "active":
        return { label: "Active", className: "bg-emerald-100 text-emerald-700" };
      case "closed":
        return { label: "Closed", className: "bg-gray-100 text-gray-700" };
      case "on_hold":
        return { label: "On hold", className: "bg-amber-100 text-amber-800" };
      case "archived":
        return { label: "Archived", className: "bg-slate-100 text-slate-700" };
      default:
        return { label: status, className: "bg-muted text-muted-foreground" };
    }
  }, [status]);

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

