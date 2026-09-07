import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Pencil, PlayCircle, PauseCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketplaceItem } from "@/redux/slice/super-admin/marketplace/marketplace";

type Props = {
  readonly item: MarketplaceItem;
  readonly onEdit: (item: MarketplaceItem) => void;
  readonly onActivate: (item: MarketplaceItem) => void;
  readonly onSuspend: (item: MarketplaceItem) => void;
  readonly onDelete: (item: MarketplaceItem) => void;
};

export function MarketplaceListingCard({
  item,
  onEdit,
  onActivate,
  onSuspend,
  onDelete,
}: Props) {
  return (
    <div className="bg-card text-card-foreground flex flex-col rounded-xl border overflow-hidden mt-6">
      {/* Image flush to top */}
      <div className="relative w-full h-40">
        <Image
          src={item.images?.[0] ?? "/marketplace.jpg"}
          alt={item.companyName ?? "Marketplace"}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-semibold truncate">{item.companyName}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {item.productName} · {item.productCategory}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {item.productDescription}
        </p>

        <div className="flex flex-wrap gap-2 mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => onEdit(item)}
          >
            <Pencil className="w-4 h-4" />
          </Button>

          {item.status === "suspended" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-green-600"
              onClick={() => onActivate(item)}
            >
              <PlayCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-amber-600"
              onClick={() => onSuspend(item)}
            >
              <PauseCircle className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-destructive"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}