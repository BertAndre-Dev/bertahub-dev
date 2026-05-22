"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AssetMaintenanceRecord } from "@/redux/slice/admin/asset-maintenance/admin-asset-maintenance";
import {
  buildCalendarCells,
  buildMaintenanceScheduleEvents,
  formatMonthYear,
  getCalendarMonthBounds,
  getServiceBadgeStyle,
  SCHEDULE_BADGE_STYLES,
  type MaintenanceScheduleEvent,
} from "../lib/maintenance-schedule";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

type Props = {
  records: AssetMaintenanceRecord[];
  loading?: boolean;
  onSchedule?: () => void;
  onEventClick?: (record: AssetMaintenanceRecord) => void;
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
  const styles =
    event.kind === "service"
      ? getServiceBadgeStyle(event.tag)
      : SCHEDULE_BADGE_STYLES[event.kind];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-1 w-full rounded-md px-1.5 py-1 text-center text-[10px] leading-tight transition-opacity hover:opacity-90 ${
        onClick ? "cursor-pointer" : "cursor-default"
      } ${styles.container}`}
    >
      <div className={`truncate ${styles.tag}`}>{event.tag}</div>
      <div className={`truncate ${styles.label}`}>{event.label}</div>
    </button>
  );
}

export default function MaintenanceScheduleCalendar({
  records,
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

  const { rangeStart, rangeEnd } = useMemo(() => {
    const { gridStart, gridEnd } = getCalendarMonthBounds(viewDate);
    return { rangeStart: gridStart, rangeEnd: gridEnd };
  }, [viewDate]);

  const events = useMemo(
    () => buildMaintenanceScheduleEvents(records, rangeStart, rangeEnd),
    [records, rangeStart, rangeEnd],
  );

  const cells = useMemo(
    () => buildCalendarCells(viewDate, events),
    [viewDate, events],
  );

  const goPrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  return (
    <Card className="overflow-hidden border border-border bg-white p-0 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
          Maintenance Schedule
        </h2>
        {showScheduleButton && onSchedule && (
          <Button
            type="button"
            className="shrink-0 cursor-pointer rounded-lg px-5 text-white disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0150AC" }}
            disabled={scheduleDisabled}
            onClick={onSchedule}
          >
            + Schedule
          </Button>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 px-4 py-3">
        <button
          type="button"
          aria-label="Previous month"
          className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={goPrevMonth}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="min-w-[10rem] text-center text-sm font-semibold tracking-[0.12em] text-foreground">
          {formatMonthYear(viewDate)}
        </span>
        <button
          type="button"
          aria-label="Next month"
          className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={goNextMonth}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="border-t border-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="border-r border-border px-2 py-2.5 text-center text-[11px] font-medium tracking-wide text-muted-foreground last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
            Loading schedule…
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((cell) => (
              <div
                key={cell.date.toISOString()}
                className={`min-h-[88px] border-b border-r border-border p-1.5 sm:min-h-[100px] [&:nth-child(7n)]:border-r-0 ${
                  cell.inMonth ? "bg-white" : "bg-muted/20"
                }`}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={`text-xs font-medium ${
                      cell.inMonth ? "text-foreground" : "text-muted-foreground/60"
                    }`}
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
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
