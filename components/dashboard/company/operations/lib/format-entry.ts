const FULL_WIDTH_KEYS = new Set([
  "description",
  "notes",
  "comment",
  "remarks",
  "details",
  "actions_taken",
  "actionsTaken",
  "action_taken",
  "actionTaken",
]);

const KEY_PRIORITY: Record<string, number> = {
  title: 0,
  incidenttitle: 0,
  incident_title: 0,
  name: 1,
  severity: 2,
  date: 3,
  datetime: 3,
  date_time: 3,
  location: 4,
  condition: 5,
  amount: 6,
  usage: 7,
  status: 90,
  description: 100,
  actions_taken: 101,
  actionstaken: 101,
  action_taken: 101,
};

function normalizeKey(key: string) {
  return key.replace(/[_\s-]/g, "").toLowerCase();
}

export function humanizeFieldKey(key: string): string {
  if (key === "date") return "Date & Time";
  const spaced = key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim();
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatDateValue(value: unknown): string {
  if (value == null || value === "") return "—";
  const raw = String(value);
  const d = new Date(raw.includes("T") ? raw : raw + "T12:00:00");
  if (Number.isNaN(d.getTime())) return raw;

  const day = d.getDate();
  const datePart = `${day}${ordinalSuffix(day)} ${d.toLocaleString("en-GB", {
    month: "short",
    year: "numeric",
  })}`;

  const hasTime =
    raw.includes("T") ||
    raw.includes(":") ||
    d.getHours() !== 0 ||
    d.getMinutes() !== 0;

  if (!hasTime) return datePart;

  const timePart = d.toLocaleString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}

export function formatEntryValue(key: string, value: unknown): string {
  if (value == null || value === "") return "—";
  if (key === "date" || /date|time/i.test(key)) {
    return formatDateValue(value);
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }
  return String(value);
}

export function sortEntryDataKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const pa = KEY_PRIORITY[normalizeKey(a)] ?? KEY_PRIORITY[a] ?? 50;
    const pb = KEY_PRIORITY[normalizeKey(b)] ?? KEY_PRIORITY[b] ?? 50;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });
}

export function isFullWidthFieldKey(key: string): boolean {
  return FULL_WIDTH_KEYS.has(key) || FULL_WIDTH_KEYS.has(normalizeKey(key));
}

export type EntryDisplayRow = {
  keys: string[];
  fullWidth: boolean;
};

export function buildEntryDisplayRows(data: Record<string, unknown>): EntryDisplayRow[] {
  const keys = sortEntryDataKeys(Object.keys(data).filter((k) => k !== "date"));
  const rows: EntryDisplayRow[] = [];

  if ("date" in data) {
    rows.push({ keys: ["date"], fullWidth: false });
  }

  let i = 0;
  while (i < keys.length) {
    const key = keys[i];
    if (isFullWidthFieldKey(key)) {
      rows.push({ keys: [key], fullWidth: true });
      i += 1;
      continue;
    }
    const next = keys[i + 1];
    if (next && !isFullWidthFieldKey(next)) {
      rows.push({ keys: [key, next], fullWidth: false });
      i += 2;
    } else {
      rows.push({ keys: [key], fullWidth: false });
      i += 1;
    }
  }

  return rows;
}

export function getEntrySortDate(entry: {
  data?: Record<string, unknown>;
  createdAt?: string;
}): number {
  const reportDate = entry.data?.date;
  if (reportDate != null && reportDate !== "") {
    const d = new Date(String(reportDate));
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  if (entry.createdAt) {
    const d = new Date(entry.createdAt);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  return 0;
}
