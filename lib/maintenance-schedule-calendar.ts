/** Calendar helpers for asset maintenance — uses API fields only. */

export type MaintenanceRecordLike = {
  id?: string;
  _id?: string;
  tag?: string;
  assetId?: string | { id?: string; _id?: string; name?: string };
  nextMaintenanceDate?: string;
  isActive?: boolean;
};

export type MaintenanceScheduleEvent = {
  id: string;
  recordId: string;
  date: Date;
  title: string;
  record: MaintenanceRecordLike;
};

export const SCHEDULE_EVENT_BADGE_STYLE = {
  container: "bg-[#E7F5FF] border border-[#A5D8FF]",
  title: "text-[#1971C2] font-semibold",
};

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getRecordId(record: MaintenanceRecordLike) {
  return record.id || record._id || record.tag || "";
}

export function resolveAssetId(
  assetId: MaintenanceRecordLike["assetId"],
): string {
  if (!assetId) return "";
  if (typeof assetId === "string") return assetId.trim();
  return String(assetId.id ?? assetId._id ?? "").trim();
}

export function buildAssetNameMap(
  assets: Array<{ id?: string; _id?: string; name?: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const asset of assets) {
    const id = String(asset.id ?? asset._id ?? "").trim();
    const name = asset.name?.trim();
    if (id && name) map.set(id, name);
  }
  return map;
}

export function resolveAssetDisplayName(
  record: MaintenanceRecordLike,
  assetNamesById: Map<string, string>,
): string {
  const assetId = resolveAssetId(record.assetId);
  if (assetId && assetNamesById.has(assetId)) {
    return assetNamesById.get(assetId)!;
  }
  if (
    typeof record.assetId === "object" &&
    record.assetId?.name &&
    record.assetId.name.trim()
  ) {
    return record.assetId.name.trim();
  }
  return record.tag?.trim() || "Asset";
}

/** One calendar event per record on its API `nextMaintenanceDate`. */
export function buildMaintenanceScheduleEvents(
  records: MaintenanceRecordLike[],
  rangeStart: Date,
  rangeEnd: Date,
  assetNamesById: Map<string, string> = new Map(),
): MaintenanceScheduleEvent[] {
  const events: MaintenanceScheduleEvent[] = [];
  const rangeStartDay = startOfDay(rangeStart);
  const rangeEndDay = startOfDay(rangeEnd);

  for (const record of records) {
    if (record.isActive === false) continue;
    if (!record.nextMaintenanceDate) continue;

    const due = new Date(record.nextMaintenanceDate);
    if (Number.isNaN(due.getTime())) continue;

    const dueDay = startOfDay(due);
    if (dueDay < rangeStartDay || dueDay > rangeEndDay) continue;

    const recordId = getRecordId(record);
    events.push({
      id: `${recordId}-${toDateKey(dueDay)}`,
      recordId,
      date: dueDay,
      title: resolveAssetDisplayName(record, assetNamesById),
      record,
    });
  }

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
