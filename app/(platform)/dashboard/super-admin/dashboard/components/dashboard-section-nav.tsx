"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type DashboardSectionItem = {
  id: string;
  label: string;
};

type DashboardSectionNavProps = Readonly<{
  sections: ReadonlyArray<DashboardSectionItem>;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  className?: string;
}>;

const TOPBAR_HEIGHT_PX = 80;
const SCROLL_SPY_LOCK_MS = 700;

function getScrollParent(
  el: HTMLElement | null,
  fallback: HTMLElement | null,
): HTMLElement | Window {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return fallback ?? window;
}

export function DashboardSectionNav({
  sections,
  scrollContainerRef,
  className,
}: DashboardSectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);
  const isScrollingRef = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (sections.length === 0) return;

    const sectionElements = sections
      .map((section) => ({
        id: section.id,
        el: document.getElementById(`dashboard-section-${section.id}`),
      }))
      .filter((entry): entry is { id: string; el: HTMLElement } =>
        Boolean(entry.el),
      );

    if (sectionElements.length === 0) return;

    const scrollRoot =
      scrollContainerRef?.current ??
      getScrollParent(sectionElements[0].el, null);

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );

        const topEntry = visible[0];
        if (!topEntry) return;

        const matched = sectionElements.find(({ el }) => el === topEntry.target);
        if (matched) setActiveId(matched.id);
      },
      {
        root: scrollRoot instanceof HTMLElement ? scrollRoot : null,
        rootMargin: "-25% 0px -55% 0px",
        threshold: 0,
      },
    );

    for (const { el } of sectionElements) observer.observe(el);
    return () => observer.disconnect();
  }, [sections, scrollContainerRef]);

  const scrollToSection = useCallback(
    (id: string) => {
      const el = document.getElementById(`dashboard-section-${id}`);
      if (!el) return;

      isScrollingRef.current = true;
      setActiveId(id);

      const navHeight = navRef.current?.offsetHeight ?? 52;
      const offset = TOPBAR_HEIGHT_PX + navHeight + 12;

      const scrollRoot =
        scrollContainerRef?.current ?? getScrollParent(el, null);

      if (scrollRoot === window) {
        const y = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({
          top: y,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      } else {
        const container = scrollRoot as HTMLElement;
        const elementTop =
          el.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop;
        container.scrollTo({
          top: elementTop - offset,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }

      window.setTimeout(() => {
        isScrollingRef.current = false;
      }, SCROLL_SPY_LOCK_MS);
    },
    [reduceMotion, scrollContainerRef],
  );

  if (sections.length === 0) return null;

  return (
    <nav
      ref={navRef}
      aria-label="Dashboard sections"
      className={cn(
        "sticky top-20 z-20 -mx-1 border-b border-border/50 px-1 py-2.5",
        "bg-background/85 backdrop-blur-xl backdrop-saturate-150",
        "supports-[backdrop-filter]:bg-background/70",
        className,
      )}
    >
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              type="button"
              aria-current={isActive ? "true" : undefined}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium",
                "transition-[transform,background-color,color,box-shadow] duration-150",
                "active:scale-[0.97]",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
