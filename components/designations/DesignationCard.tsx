"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import {
  getDesignationScope,
  type Designation,
} from "@/lib/designations";
import { cn } from "@/lib/utils";

type Props = {
  item: Designation;
  inherited?: boolean;
  onEdit: (item: Designation) => void;
  onToggleActive: (item: Designation) => void;
  onDelete: (item: Designation) => void;
};

function ActionButton({
  label,
  onClick,
  className,
  children,
}: Readonly<{
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-white/80 shadow-sm",
        "transition-transform duration-100 ease-out active:scale-[0.94]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0150AC]/35",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DesignationCard({
  item,
  inherited = false,
  onEdit,
  onToggleActive,
  onDelete,
}: Readonly<Props>) {
  const reduceMotion = useReducedMotion();
  const scope = getDesignationScope(item);
  const inactive = item.isActive === false;

  return (
    <motion.article
      layout
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      transition={
        reduceMotion
          ? { duration: 0.16 }
          : { type: "spring", bounce: 0, duration: 0.35 }
      }
      className={cn(
        "group relative overflow-hidden rounded-[22px] border border-white/50 p-5",
        "bg-white/70 shadow-[0_8px_30px_rgba(15,23,42,0.06)]",
        "backdrop-blur-[18px] saturate-[160%]",
        "transition-transform duration-100 ease-out active:scale-[0.985]",
        "motion-reduce:bg-white motion-reduce:backdrop-blur-none",
        "[@media(prefers-reduced-transparency:reduce)]:bg-white",
        "[@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none",
        inactive && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[0.02em]",
                scope === "company"
                  ? "bg-[#0150AC]/10 text-[#0150AC]"
                  : "bg-emerald-500/10 text-emerald-700",
              )}
            >
              {scope === "company" ? "Company" : "Estate"}
            </span>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                inactive
                  ? "bg-black/6 text-black/50"
                  : "bg-emerald-500/10 text-emerald-700",
              )}
            >
              {inactive ? "Inactive" : "Active"}
            </span>
          </div>
          <h3 className="mt-2 truncate font-heading text-[26px] font-semibold leading-[1.1] tracking-[-0.025em]">
            {item.name}
          </h3>
          {item.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-black/55">
              {item.description}
            </p>
          ) : (
            <p className="mt-2 text-sm text-black/35">No description</p>
          )}
          {inherited ? (
            <p className="mt-3 text-xs text-black/40">
              Inherited from the parent company. Estate admins can’t edit this
              title.
            </p>
          ) : null}
        </div>

        {inherited ? null : (
          <div className="flex shrink-0 items-center gap-1.5">
            <ActionButton label={`Edit ${item.name}`} onClick={() => onEdit(item)}>
              <Pencil className="size-4 text-[#0150AC]" />
            </ActionButton>
            <ActionButton
              label={inactive ? `Activate ${item.name}` : `Deactivate ${item.name}`}
              onClick={() => onToggleActive(item)}
            >
              {inactive ? (
                <Power className="size-4 text-emerald-600" />
              ) : (
                <PowerOff className="size-4 text-amber-600" />
              )}
            </ActionButton>
            <ActionButton
              label={`Delete ${item.name}`}
              onClick={() => onDelete(item)}
            >
              <Trash2 className="size-4 text-red-600" />
            </ActionButton>
          </div>
        )}
      </div>
    </motion.article>
  );
}
