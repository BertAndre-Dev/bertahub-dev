"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  buildCalendarCells,
  buildMaintenanceScheduleEvents,
  formatMonthYear,
  getCalendarMonthBounds,
  SCHEDULE_EVENT_BADGE_STYLE,
  startOfDay,
  toDateKey,
  type MaintenanceRecordLike,
  type MaintenanceScheduleEvent,
} from "@/lib/maintenance-schedule-calendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Props = {
  records: MaintenanceRecordLike[];
  assetNamesById?: Map<string, string>;
  loading?: boolean;
  onSchedule?: () => void;
  onEventClick?: (record: MaintenanceRecordLike) => void;
  scheduleDisabled?: boolean;
  showScheduleButton?: boolean;
};

function EventBadge({
  event,
  onClick,
}: {
  event: MaintenanceScheduleEvent;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group mb-1 flex w-full items-center gap-1 rounded-md border px-1.5 py-1 text-left text-[10px] leading-tight shadow-sm transition-all",
        onClick
          ? "cursor-pointer hover:-translate-y-px hover:shadow-md active:translate-y-0"
          : "cursor-default",
        SCHEDULE_EVENT_BADGE_STYLE.container,
      )}
    >
      <Wrench
        className={cn(
          "h-2.5 w-2.5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100",
          SCHEDULE_EVENT_BADGE_STYLE.icon,
        )}
        aria-hidden
      />
      <span className={cn("truncate font-semibold", SCHEDULE_EVENT_BADGE_STYLE.title)}>
        {event.title}
      </span>
    </button>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-px bg-border/60 p-px">
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="min-h-[88px] animate-pulse bg-white p-2 sm:min-h-[100px]"
        >
          <div className="mb-2 flex justify-end">
            <div className="h-6 w-6 rounded-full bg-muted" />
          </div>
          {i % 5 === 0 && <div className="h-5 rounded-md bg-muted/80" />}
        </div>
      ))}
    </div>
  );
}

export default function MaintenanceScheduleCalendar({
  records,
  assetNamesById,
  loading,
  onSchedule,
  onEventClick,
  scheduleDisabled,
  showScheduleButton = true,
}: Props) {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const todayKey = useMemo(() => toDateKey(startOfDay(new Date())), []);

  const { rangeStart, rangeEnd } = useMemo(() => {
    const { gridStart, gridEnd } = getCalendarMonthBounds(viewDate);
    return { rangeStart: gridStart, rangeEnd: gridEnd };
  }, [viewDate]);

  const events = useMemo(
    () =>
      buildMaintenanceScheduleEvents(
        records,
        rangeStart,
        rangeEnd,
        assetNamesById,
      ),
    [records, rangeStart, rangeEnd, assetNamesById],
  );

  const cells = useMemo(
    () => buildCalendarCells(viewDate, events),
    [viewDate, events],
  );

  const isViewingCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      viewDate.getFullYear() === now.getFullYear() &&
      viewDate.getMonth() === now.getMonth()
    );
  }, [viewDate]);

  const goPrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const goToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <Card className="overflow-hidden rounded-xl border-0 bg-white p-0 shadow-lg ring-1 ring-black/5">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0150AC] via-[#013d85] to-[#012a5c] px-5 py-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 -left-6 h-28 w-28 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
              <CalendarDays className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white sm:text-2xl">
                Maintenance Schedule
              </h2>
              <p className="mt-0.5 text-sm text-white/75">
                {loading
                  ? "Loading upcoming tasks…"
                  : events.length === 0
                    ? "No maintenance scheduled this month"
                    : `${events.length} maintenance scheduled${events.length === 1 ? " is" : "are"} for this month`}
              </p>
            </div>
          </div>

          {showScheduleButton && onSchedule && (
            <Button
              type="button"
              className="shrink-0 cursor-pointer rounded-lg border border-white/20 bg-white px-5 font-semibold text-[#0150AC] shadow-sm transition-colors hover:bg-white/95 disabled:cursor-not-allowed"
              disabled={scheduleDisabled}
              onClick={onSchedule}
            >
              + Schedule
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-gradient-to-b from-slate-50 to-white px-4 py-3">
        <button
          type="button"
          aria-label="Previous month"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-all hover:border-[#0150AC]/30 hover:text-[#0150AC] hover:shadow"
          onClick={goPrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
          <span className="text-center text-base font-semibold tracking-wide text-foreground sm:text-lg">
            {formatMonthYear(viewDate)}
          </span>
          {!isViewingCurrentMonth && (
            <button
              type="button"
              onClick={goToday}
              className="cursor-pointer rounded-full border border-[#0150AC]/25 bg-[#E7F5FF] px-3 py-0.5 text-xs font-medium text-[#0150AC] transition-colors hover:bg-[#d0ebff]"
            >
              Today
            </button>
          )}
        </div>

        <button
          type="button"
          aria-label="Next month"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-all hover:border-[#0150AC]/30 hover:text-[#0150AC] hover:shadow"
          onClick={goNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div>
        <div className="grid grid-cols-7 border-b border-border/80 bg-[#f4f8fc]">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={cn(
                "px-1 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider",
                index === 0 || index === 6
                  ? "text-[#0150AC]/70"
                  : "text-muted-foreground",
              )}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <CalendarSkeleton />
        ) : (
          <div className="grid grid-cols-7 gap-px bg-border/50">
            {cells.map((cell) => {
              const cellKey = toDateKey(cell.date);
              const isToday = cellKey === todayKey;
              const hasEvents = cell.events.length > 0;
              const dayOfWeek = cell.date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <div
                  key={cell.date.toISOString()}
                  className={cn(
                    "group relative min-h-[88px] p-1.5 transition-colors sm:min-h-[104px] sm:p-2",
                    cell.inMonth ? "bg-white" : "bg-slate-50/80",
                    cell.inMonth &&
                      hasEvents &&
                      "bg-gradient-to-b from-[#f8fbff] to-white",
                    cell.inMonth &&
                      !hasEvents &&
                      isWeekend &&
                      "bg-slate-50/60",
                    cell.inMonth && "hover:bg-[#f4f9ff]",
                  )}
                >
                  {hasEvents && cell.inMonth && (
                    <span
                      className="absolute left-0 top-0 h-full w-0.5 rounded-r-full bg-[#0150AC]/60"
                      aria-hidden
                    />
                  )}

                  <div className="mb-1.5 flex items-center justify-between gap-1">
                    {hasEvents && cell.inMonth ? (
                      <span className="rounded-full bg-[#E7F5FF] px-1.5 py-0.5 text-[9px] font-semibold text-[#1971C2]">
                        {cell.events.length}
                      </span>
                    ) : (
                      <span aria-hidden />
                    )}
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                        isToday &&
                          "bg-[#0150AC] text-white shadow-md ring-2 ring-[#0150AC]/20",
                        !isToday &&
                          cell.inMonth &&
                          "text-foreground group-hover:bg-muted/60",
                        !isToday &&
                          !cell.inMonth &&
                          "text-muted-foreground/45",
                      )}
                    >
                      {cell.day}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {cell.events.map((event) => (
                      <EventBadge
                        key={event.id}
                        event={event}
                        onClick={
                          onEventClick
                            ? () => onEventClick(event.record)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
