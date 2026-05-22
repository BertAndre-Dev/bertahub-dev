import {
  addMaintenanceInterval,
  isInspectionFrequency,
} from "@/lib/asset-maintenance-frequency";
import type { AssetMaintenanceRecord } from "@/redux/slice/admin/asset-maintenance/admin-asset-maintenance";

export type ScheduleEventKind = "inspection" | "service" | "overdue";

export type MaintenanceScheduleEvent = {
  id: string;
  recordId: string;
  date: Date;
  tag: string;
  label: string;
  kind: ScheduleEventKind;
  record: AssetMaintenanceRecord;
};

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getRecordId(record: AssetMaintenanceRecord) {
  return record.id || record._id || record.tag || "";
}

function classifyEvent(
  dueDate: Date,
  frequency: string | undefined,
): Pick<MaintenanceScheduleEvent, "kind" | "label"> {
  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);

  if (due.getTime() < today.getTime()) {
    return { kind: "overdue", label: "Overdue" };
  }

  if (isInspectionFrequency(frequency)) {
    return { kind: "inspection", label: "Inspection" };
  }

  return {
    kind: "service",
    label: "Service",
  };
}

/** Next due dates from last maintenance + frequency within [rangeStart, rangeEnd]. */
export function buildMaintenanceScheduleEvents(
  records: AssetMaintenanceRecord[],
  rangeStart: Date,
  rangeEnd: Date,
): MaintenanceScheduleEvent[] {
  const events: MaintenanceScheduleEvent[] = [];
  const rangeStartDay = startOfDay(rangeStart);
  const rangeEndDay = startOfDay(rangeEnd);

  records.forEach((record) => {
    if (record.isActive === false) return;
    if (!record.lastMaintenanceDate || !record.frequency) return;

    const last = new Date(record.lastMaintenanceDate);
    if (Number.isNaN(last.getTime())) return;

    let due = addMaintenanceInterval(last, record.frequency);
    let guard = 0;

    while (due <= rangeEndDay && guard < 120) {
      guard += 1;
      const dueDay = startOfDay(due);

      if (dueDay >= rangeStartDay) {
        const { kind, label } = classifyEvent(dueDay, record.frequency);
        const recordId = getRecordId(record);
        events.push({
          id: `${recordId}-${toDateKey(dueDay)}`,
          recordId,
          date: dueDay,
          tag: record.tag?.trim() || "ASSET",
          label,
          kind,
          record,
        });
      }

      due = addMaintenanceInterval(due, record.frequency);
    }
  });

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}

export function getCalendarMonthBounds(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startPad = firstOfMonth.getDay();
  const daysInMonth = lastOfMonth.getDate();
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const gridStart = new Date(year, month, 1 - startPad);
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridStart.getDate() + totalCells - 1);
  return { firstOfMonth, lastOfMonth, gridStart, gridEnd };
}

export type CalendarCell = {
  date: Date;
  inMonth: boolean;
  day: number;
  events: MaintenanceScheduleEvent[];
};

export function buildCalendarCells(
  viewDate: Date,
  events: MaintenanceScheduleEvent[],
): CalendarCell[] {
  const { firstOfMonth, gridStart, gridEnd } = getCalendarMonthBounds(viewDate);
  const byDay = new Map<string, MaintenanceScheduleEvent[]>();

  for (const event of events) {
    const key = toDateKey(event.date);
    const list = byDay.get(key) ?? [];
    list.push(event);
    byDay.set(key, list);
  }

  const cells: CalendarCell[] = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    const key = toDateKey(cursor);
    cells.push({
      date: new Date(cursor),
      inMonth: cursor.getMonth() === firstOfMonth.getMonth(),
      day: cursor.getDate(),
      events: byDay.get(key) ?? [],
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}

export function formatMonthYear(viewDate: Date) {
  return viewDate
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();
}

export const SCHEDULE_BADGE_STYLES: Record<
  ScheduleEventKind,
  { container: string; tag: string; label: string }
> = {
  inspection: {
    container: "bg-[#FFF4E6] border border-[#FFD8A8]",
    tag: "text-[#E67700] font-semibold",
    label: "text-[#E67700]",
  },
  service: {
    container: "bg-[#E7F5FF] border border-[#A5D8FF]",
    tag: "text-[#1971C2] font-semibold",
    label: "text-[#1971C2]",
  },
  overdue: {
    container: "bg-[#FFF5F5] border border-[#FFC9C9]",
    tag: "text-[#C92A2A] font-semibold",
    label: "text-[#C92A2A]",
  },
};

/** Alternate service badge between blue and green like Figma. */
export function getServiceBadgeStyle(tag: string) {
  const green = tag.length % 2 === 1;
  if (green) {
    return {
      container: "bg-[#EBFBEE] border border-[#B2F2BB]",
      tag: "text-[#2B8A3E] font-semibold",
      label: "text-[#2B8A3E]",
    };
  }
  return SCHEDULE_BADGE_STYLES.service;
}
