"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronRight, Store } from "lucide-react";
import { MarketplaceAdDetail } from "@/components/marketplace/MarketplaceAdDetail";
import Modal from "@/components/modal/page";
import {
  MARKETPLACE_PRESS,
  canCreateMarketplaceAds,
  isMarketplaceModuleEnabled,
  isSettingsPath,
  marketplacePathForRole,
} from "@/lib/marketplace";
import { coverMedia } from "@/lib/marketplace-media";
import {
  selectEstateModules,
  selectUserRole,
} from "@/redux/slice/auth-mgt/auth-mgt-slice";
import {
  getMarketplaceById,
  getMarketplaceFeed,
  type MarketplaceAd,
} from "@/redux/slice/marketplace/marketplace";
import type { AppDispatch, RootState } from "@/redux/store";
import { cn } from "@/lib/utils";
import { IconTooltip } from "@/components/ui/tooltip";

const STORAGE_KEY = "berta-marketplace-rail-collapsed";
const FEED_LIMIT = 20;
const MARQUEE_SPEED_PX_S = 28;

const CATEGORY_TONE: Record<string, { wash: string; bar: string; chip: string }> =
  {
    Fashion: {
      wash: "from-rose-100 to-pink-50",
      bar: "bg-rose-500",
      chip: "bg-rose-500/15 text-rose-800",
    },
    Automobile: {
      wash: "from-blue-100 to-slate-50",
      bar: "bg-blue-600",
      chip: "bg-blue-600/15 text-blue-900",
    },
    Furniture: {
      wash: "from-amber-100 to-orange-50",
      bar: "bg-amber-500",
      chip: "bg-amber-500/15 text-amber-900",
    },
    Carpentry: {
      wash: "from-green-100 to-lime-50",
      bar: "bg-green-600",
      chip: "bg-green-600/15 text-green-900",
    },
    Insurance: {
      wash: "from-slate-200 to-blue-50",
      bar: "bg-slate-700",
      chip: "bg-slate-700/15 text-slate-800",
    },
    "Food & Drinks": {
      wash: "from-orange-100 to-red-50",
      bar: "bg-orange-500",
      chip: "bg-orange-500/15 text-orange-900",
    },
    Services: {
      wash: "from-stone-200 to-orange-50",
      bar: "bg-stone-600",
      chip: "bg-stone-600/15 text-stone-800",
    },
    Electronics: {
      wash: "from-sky-100 to-slate-50",
      bar: "bg-sky-600",
      chip: "bg-sky-600/15 text-sky-900",
    },
    "Real Estate": {
      wash: "from-emerald-100 to-green-50",
      bar: "bg-emerald-600",
      chip: "bg-emerald-600/15 text-emerald-900",
    },
    Other: {
      wash: "from-primary/20 to-primary/5",
      bar: "bg-primary",
      chip: "bg-primary/15 text-primary",
    },
  };

function nearbyCopy(count: number) {
  return count === 1 ? "1 offer nearby" : `${count} offers nearby`;
}

function categoryTone(category: unknown) {
  const key = typeof category === "string" ? category : "";
  return CATEGORY_TONE[key] ?? CATEGORY_TONE.Other;
}

type RailCardProps = Readonly<{
  item: MarketplaceAd;
  clone?: boolean;
  onOpen: (item: MarketplaceAd) => void;
}>;

function RailCard({ item, clone = false, onOpen }: RailCardProps) {
  const cover = coverMedia(item);
  const tone = categoryTone(item.productCategory);
  return (
    <button
      type="button"
      tabIndex={clone ? -1 : 0}
      aria-hidden={clone || undefined}
      onClick={() => onOpen(item)}
      className={cn(
        "flex w-64 shrink-0 items-center gap-3 overflow-hidden rounded-2xl border border-white/70 bg-linear-to-br p-2 text-left shadow-[0_8px_24px_-16px_rgba(15,23,42,0.45)]",
        tone.wash,
        MARKETPLACE_PRESS,
      )}
    >
      <span className={cn("h-12 w-1 shrink-0 rounded-full", tone.bar)} />
      <div className="size-12 overflow-hidden rounded-xl bg-white/70">
        {cover.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" className="size-12 object-cover" />
        ) : (
          <Store className="m-auto mt-3 size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium tracking-[-0.01em]">
          {item.productName ?? "Listing"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {item.companyName}
        </p>
        {item.productCategory ? (
          <span
            className={cn(
              "mt-1 inline-block rounded-full px-1.5 py-px text-[10px] font-medium tracking-[0.01em]",
              tone.chip,
            )}
          >
            {item.productCategory}
          </span>
        ) : null}
      </div>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </button>
  );
}

function MarketplaceMarquee({
  items,
  onOpen,
}: Readonly<{
  items: MarketplaceAd[];
  onOpen: (item: MarketplaceAd) => void;
}>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [copies, setCopies] = useState(2);
  const [loopPx, setLoopPx] = useState(0);
  const looping = items.length > 1;

  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    const set = setRef.current;
    if (!scroller || !set) return;
    const setWidth = set.offsetWidth;
    const view = scroller.clientWidth;
    if (setWidth <= 0) return;
    setLoopPx(setWidth);
    setCopies(Math.max(2, Math.ceil(view / setWidth) + 2));
  }, []);

  useEffect(() => {
    if (!looping) return;
    measure();
    const ro = new ResizeObserver(measure);
    if (scrollerRef.current) ro.observe(scrollerRef.current);
    if (setRef.current) ro.observe(setRef.current);
    return () => ro.disconnect();
  }, [looping, measure, items]);

  useEffect(() => {
    if (!looping) return;
    const set = setRef.current;
    if (!set) return;
    const images = [...set.querySelectorAll("img")];
    images.forEach((img) => {
      if (!img.complete) img.addEventListener("load", measure);
    });
    return () => {
      images.forEach((img) => img.removeEventListener("load", measure));
    };
  }, [looping, measure, items]);

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  const renderSet = (copyIndex: number) => (
    <div
      ref={copyIndex === 0 ? setRef : undefined}
      className="flex shrink-0 gap-3 pr-3"
      aria-hidden={copyIndex > 0 || undefined}
    >
      {items.map((item) => (
        <RailCard
          key={`${item.id ?? item.productName}-${copyIndex}`}
          item={item}
          clone={copyIndex > 0}
          onOpen={onOpen}
        />
      ))}
    </div>
  );

  if (!looping) {
    return (
      <div className="overflow-hidden px-4 pb-3 md:px-6">
        <div className="flex w-max gap-3">{renderSet(0)}</div>
      </div>
    );
  }

  const duration = loopPx > 0 ? loopPx / MARQUEE_SPEED_PX_S : 0;

  return (
    <div
      ref={scrollerRef}
      className="overflow-hidden px-4 pb-3 md:px-6"
      onPointerEnter={pause}
      onPointerLeave={resume}
      onPointerDown={pause}
      onPointerUp={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <div
        className="iso-marketplace-marquee-track flex w-max will-change-transform"
        data-paused={paused || duration === 0 ? "true" : "false"}
        style={
          {
            "--marquee-loop": `${loopPx}px`,
            animationDuration: duration ? `${duration}s` : "0s",
          } as CSSProperties
        }
      >
        {Array.from({ length: copies }, (_, copyIndex) => renderSet(copyIndex))}
      </div>
    </div>
  );
}

export function MarketplaceRail() {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const reduceMotion = useReducedMotion();
  const role = useSelector(selectUserRole);
  const modules = useSelector(selectEstateModules);
  const { feed, current, getFeedStatus } = useSelector(
    (state: RootState) => state.marketplace,
  );
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<MarketplaceAd | null>(null);

  const hidden =
    isSettingsPath(pathname) || !isMarketplaceModuleEnabled(role, modules);

  useEffect(() => {
    try {
      setCollapsed(sessionStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setCollapsed(false);
    }
  }, []);

  useEffect(() => {
    if (hidden) return;
    if (getFeedStatus === "succeeded" || getFeedStatus === "isLoading") return;
    dispatch(getMarketplaceFeed({ page: 1, limit: FEED_LIMIT }));
  }, [dispatch, getFeedStatus, hidden]);

  const openListing = (item: MarketplaceAd) => {
    setSelected(item);
    if (item.id) {
      void dispatch(getMarketplaceById(item.id));
    }
  };

  if (hidden || feed.length === 0) return null;

  const marketplaceHref = marketplacePathForRole(role);
  const canCreate = canCreateMarketplaceAds(role);
  const detail =
    selected && current?.id && current.id === selected.id ? current : selected;
  const autoScroll = feed.length > 1 && !reduceMotion;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  return (
    <>
      <section className="border-b border-black/5 bg-linear-to-r from-orange-50/90 via-background/80 to-emerald-50/90 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-2 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
              <Store className="size-3.5" />
            </span>
            <p className="truncate text-sm font-medium tracking-[-0.01em]">
              {collapsed ? nearbyCopy(feed.length) : "From the marketplace"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canCreate ? (
              <Link
                href={marketplaceHref}
                className={cn(
                  "hidden rounded-full px-3 py-1 text-xs font-medium text-primary sm:inline",
                  MARKETPLACE_PRESS,
                )}
              >
                Post
              </Link>
            ) : null}
            <Link
              href={marketplaceHref}
              className={cn(
                "rounded-full px-3 py-1 text-xs text-muted-foreground hover:text-foreground",
                MARKETPLACE_PRESS,
              )}
            >
              See all
            </Link>
            <IconTooltip
              label={
                collapsed ? "Show marketplace offers" : "Hide marketplace offers"
              }
            >
              <button
                type="button"
                onClick={toggleCollapsed}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted",
                  MARKETPLACE_PRESS,
                )}
                aria-expanded={!collapsed}
                aria-label={
                  collapsed ? "Show marketplace offers" : "Hide marketplace offers"
                }
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    collapsed ? "-rotate-90" : "rotate-0",
                  )}
                />
              </button>
            </IconTooltip>
          </div>
        </div>

        {!collapsed && autoScroll ? (
          <MarketplaceMarquee items={feed} onOpen={openListing} />
        ) : null}
        {!collapsed && !autoScroll ? (
          <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-3 md:px-6">
            {feed.map((item) => (
              <div key={item.id ?? item.productName} className="snap-start">
                <RailCard item={item} onOpen={openListing} />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <Modal
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
        contentClassName="md:w-[min(36rem,92vw)]"
      >
        {detail ? (
          <MarketplaceAdDetail
            key={detail.id ?? detail.productName}
            item={detail}
          />
        ) : null}
      </Modal>
    </>
  );
}
