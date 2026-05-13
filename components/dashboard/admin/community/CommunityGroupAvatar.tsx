"use client";

import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  name: string;
  profileImage?: string | null;
  className?: string;
  iconClassName?: string;
  /** When true, use a light circle + primary-colored icon (chat header style). */
  variant?: "default" | "onBrand";
}>;

export function CommunityGroupAvatar({
  name,
  profileImage,
  className,
  iconClassName,
  variant = "default",
}: Props) {
  const src = (profileImage ?? "").trim();
  if (src) {
    return (
      <img
        src={src}
        alt=""
        title={name}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  if (variant === "onBrand") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-white text-primary",
          className,
        )}
        aria-hidden
      >
        <Users className={iconClassName ?? "size-5"} />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      <Users className={iconClassName ?? "size-5"} />
    </div>
  );
}
