"use client";

import { ExternalLink, Pencil, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketplaceStatusBadge } from "@/components/marketplace/MarketplaceStatusBadge";
import {
  marketplaceAudienceLabel,
  MARKETPLACE_PRESS,
  normalizeMarketplaceStatus,
} from "@/lib/marketplace";
import { coverMedia } from "@/lib/marketplace-media";
import type { MarketplaceAd } from "@/redux/slice/marketplace/marketplace";
import { cn } from "@/lib/utils";
import { IconTooltip } from "@/components/ui/tooltip";

type Props = Readonly<{
  item: MarketplaceAd;
  showStatus?: boolean;
  onOpen?: (item: MarketplaceAd) => void;
  onEdit?: (item: MarketplaceAd) => void;
  onDelete?: (item: MarketplaceAd) => void;
  onSuspend?: (item: MarketplaceAd) => void;
  onActivate?: (item: MarketplaceAd) => void;
  onApprove?: (item: MarketplaceAd) => void;
  onReject?: (item: MarketplaceAd) => void;
}>;

export function MarketplaceAdCard({
  item,
  showStatus = false,
  onOpen,
  onEdit,
  onDelete,
  onSuspend,
  onActivate,
  onApprove,
  onReject,
}: Props) {
  const cover = coverMedia(item);
  const status = normalizeMarketplaceStatus(item.status);
  const hasActions = Boolean(
    onEdit || onDelete || onSuspend || onActivate || onApprove || onReject,
  );

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-card shadow-sm",
        onOpen && "cursor-pointer",
      )}
    >
      <button
        type="button"
        className={cn("text-left", MARKETPLACE_PRESS)}
        onClick={() => onOpen?.(item)}
        disabled={!onOpen}
      >
        <div className="relative aspect-[16/10] bg-muted/50">
          {cover.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : cover.type === "video" ? (
            <video
              src={cover.url}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No media
            </div>
          )}
          <span className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            {item.productCategory ?? "Listing"}
          </span>
        </div>
        <div className="space-y-1.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold tracking-[-0.02em]">
              {item.companyName ?? "—"}
            </h3>
            {showStatus ? <MarketplaceStatusBadge status={item.status} /> : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {item.productName ?? "—"}
          </p>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {item.productDescription ?? ""}
          </p>
          {showStatus ? (
            <p className="text-[11px] text-muted-foreground">
              {marketplaceAudienceLabel(item.audience)}
              {item.startDate && item.endDate
                ? ` · ${String(item.startDate).slice(0, 10)} – ${String(item.endDate).slice(0, 10)}`
                : ""}
            </p>
          ) : null}
          {item.rejectionReason && status === "REJECTED" ? (
            <p className="text-xs text-destructive">{item.rejectionReason}</p>
          ) : null}
        </div>
      </button>

      {hasActions ? (
        <div className="flex flex-wrap gap-1 border-t border-black/5 px-2 py-2">
          {onApprove ? (
            <Button size="sm" className={cn("h-9 rounded-lg", MARKETPLACE_PRESS)} onClick={() => onApprove(item)}>
              Approve
            </Button>
          ) : null}
          {onReject ? (
            <Button
              size="sm"
              variant="outline"
              className={cn("h-9 rounded-lg", MARKETPLACE_PRESS)}
              onClick={() => onReject(item)}
            >
              Reject
            </Button>
          ) : null}
          {onEdit ? (
            <IconTooltip label="Edit">
              <Button size="sm" variant="ghost" className={MARKETPLACE_PRESS} onClick={() => onEdit(item)} aria-label="Edit">
                <Pencil className="size-4" />
              </Button>
            </IconTooltip>
          ) : null}
          {status === "SUSPENDED" && onActivate ? (
            <IconTooltip label="Activate">
              <Button size="sm" variant="ghost" className={MARKETPLACE_PRESS} onClick={() => onActivate(item)} aria-label="Activate">
                <PlayCircle className="size-4" />
              </Button>
            </IconTooltip>
          ) : null}
          {status === "ACTIVE" && onSuspend ? (
            <IconTooltip label="Suspend">
              <Button size="sm" variant="ghost" className={MARKETPLACE_PRESS} onClick={() => onSuspend(item)} aria-label="Suspend">
                <PauseCircle className="size-4" />
              </Button>
            </IconTooltip>
          ) : null}
          {onDelete ? (
            <IconTooltip label="Delete">
              <Button
                size="sm"
                variant="ghost"
                className={cn("text-destructive", MARKETPLACE_PRESS)}
                onClick={() => onDelete(item)}
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </Button>
            </IconTooltip>
          ) : null}
          {item.link ? (
            <IconTooltip label="Open link">
              <Button size="sm" variant="ghost" className={cn("ml-auto", MARKETPLACE_PRESS)} asChild>
                <a href={item.link} target="_blank" rel="noopener noreferrer" aria-label="Open link">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </IconTooltip>
          ) : null}
        </div>
      ) : item.link ? (
        <div className="px-4 pb-4">
          <Button asChild variant="outline" className={cn("h-10 w-full rounded-xl", MARKETPLACE_PRESS)}>
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              Visit
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      ) : null}
    </article>
  );
}
