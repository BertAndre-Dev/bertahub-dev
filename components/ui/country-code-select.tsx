"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import {
  getCountries,
  getCountryCallingCode,
  type Country,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import labels from "react-phone-number-input/locale/en";
import { cn } from "@/lib/utils";

type CountryOption = {
  iso: Country;
  name: string;
  dialCode: string;
};

const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((iso) => ({
    iso,
    name: labels[iso] ?? iso,
    dialCode: `+${getCountryCallingCode(iso)}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

function normalizeDialCode(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? `+${digits}` : "";
}

function findOption(value: string) {
  const normalized = normalizeDialCode(value);
  if (!normalized) return undefined;
  return COUNTRY_OPTIONS.find((option) => option.dialCode === normalized);
}

function CountryFlag({ iso, name }: { iso: Country; name: string }) {
  const Flag = flags[iso];
  if (!Flag) {
    return (
      <span className="flex h-3.5 w-5 shrink-0 items-center justify-center rounded-[2px] bg-muted text-[9px] font-medium text-muted-foreground">
        {iso}
      </span>
    );
  }
  return (
    <span className="block h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)] [&_svg]:block [&_svg]:h-full [&_svg]:w-full">
      <Flag title={name} />
    </span>
  );
}

type CountryCodeSelectProps = {
  id?: string;
  value: string;
  onChange: (countryCode: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  /** Sit inside a combined phone field (no outer border/margin). */
  embedded?: boolean;
};

export function CountryCodeSelect({
  id,
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Select code",
  embedded = false,
}: CountryCodeSelectProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listId = `${triggerId}-list`;
  const searchId = `${triggerId}-search`;
  const reduceMotion = useReducedMotion();
  const searchRef = useRef<HTMLInputElement>(null);
  const highlightedRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selected = findOption(value);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((option) => {
      return (
        option.name.toLowerCase().includes(needle) ||
        option.iso.toLowerCase().includes(needle) ||
        option.dialCode.includes(needle) ||
        option.dialCode.replace("+", "").includes(needle.replace("+", ""))
      );
    });
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = selected
      ? filtered.findIndex((option) => option.iso === selected.iso)
      : 0;
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, filtered, selected]);

  useEffect(() => {
    if (!open) return;
    highlightedRef.current?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open, filtered]);

  const selectOption = (option: CountryOption) => {
    onChange(option.dialCode);
    setOpen(false);
    setQuery("");
  };

  const handleOpenChange = (next: boolean) => {
    if (disabled) return;
    setOpen(next);
    if (!next) setQuery("");
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        filtered.length === 0 ? 0 : Math.min(index + 1, filtered.length - 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[highlightedIndex];
      if (option) selectOption(option);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          id={triggerId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          className={cn(
            "flex h-10 cursor-pointer items-center gap-2 bg-background text-left text-sm outline-none",
            "transition-[transform,box-shadow,border-color] duration-100 ease-out",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "motion-reduce:transition-none motion-reduce:active:scale-100",
            embedded
              ? "h-full w-auto shrink-0 rounded-none border-0 px-2.5 shadow-none active:bg-black/5 focus-visible:bg-black/5 dark:active:bg-white/10"
              : [
                  "mt-2 w-full rounded-md border border-border px-3",
                  "active:scale-[0.97]",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                ],
            className,
          )}
        >
          {selected ? (
            <>
              <CountryFlag iso={selected.iso} name={selected.name} />
              <span
                className={cn(
                  "tabular-nums tracking-tight",
                  embedded ? "shrink-0" : "min-w-0 flex-1 truncate",
                )}
              >
                {selected.dialCode}
              </span>
            </>
          ) : (
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {placeholder}
            </span>
          )}
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
              open && "rotate-180",
              "motion-reduce:transition-none",
            )}
            aria-hidden
          />
        </button>
      </Popover.Trigger>

      <AnimatePresence>
        {open ? (
          <Popover.Portal forceMount>
            <Popover.Content
              forceMount
              align="start"
              sideOffset={6}
              collisionPadding={12}
              className="z-50 w-[min(22rem,calc(100vw-2rem))] min-w-(--radix-popover-trigger-width) border-0 bg-transparent p-0 shadow-none outline-none"
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                searchRef.current?.focus();
              }}
            >
              <motion.div
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.96, y: -4 }
                }
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, scale: 1, y: 0 }
                }
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.98, y: -2 }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.15 }
                    : { type: "spring", bounce: 0, duration: 0.3 }
                }
                className={cn(
                  "flex origin-(--radix-popover-content-transform-origin) flex-col overflow-hidden rounded-xl border border-white/40 bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
                  "backdrop-blur-[20px] backdrop-saturate-150",
                  "dark:border-white/10 dark:bg-zinc-900/75",
                  "[@media(prefers-reduced-transparency:reduce)]:bg-background [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none",
                )}
              >
                <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2 dark:border-white/10">
                  <Search
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    ref={searchRef}
                    id={searchId}
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setHighlightedIndex(0);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search country or code"
                    aria-controls={listId}
                    aria-autocomplete="list"
                    className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                <div
                  id={listId}
                  role="listbox"
                  aria-label="Country codes"
                  className="max-h-64 overflow-y-auto overscroll-contain p-1"
                >
                  {filtered.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No countries match that search.
                    </p>
                  ) : (
                    filtered.map((option, index) => {
                      const isSelected = selected?.iso === option.iso;
                      const isHighlighted = index === highlightedIndex;
                      return (
                        <button
                          key={option.iso}
                          ref={isHighlighted ? highlightedRef : undefined}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onPointerDown={() => setHighlightedIndex(index)}
                          onClick={() => selectOption(option)}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none",
                            "transition-colors duration-100 ease-out active:bg-black/10 dark:active:bg-white/15",
                            "motion-reduce:transition-none",
                            isHighlighted && "bg-black/5 dark:bg-white/10",
                            isSelected && "font-medium",
                          )}
                        >
                          <CountryFlag iso={option.iso} name={option.name} />
                          <span className="min-w-0 flex-1 truncate">
                            {option.name}
                          </span>
                          <span className="shrink-0 tabular-nums tracking-tight text-muted-foreground">
                            {option.dialCode}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        ) : null}
      </AnimatePresence>
    </Popover.Root>
  );
}
