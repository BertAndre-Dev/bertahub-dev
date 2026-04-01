export type FinancialChartPoint = {
  date: string; // ISO date string (YYYY-MM-DD)
  vending: number;
  bills: number;
  revenue: number;
  expenses: number;
};

export type FinancialChartGranularity = "day" | "month" | "year";
export type FinancialChartCategory = "all" | "bills" | "vending";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function toDayKey(isoLike: string): string {
  return String(isoLike ?? "").slice(0, 10);
}

function parseDayKey(dayKey: string): Date {
  // Treat dayKey as UTC date
  return new Date(`${dayKey}T00:00:00.000Z`);
}

function formatDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysUtc(d: Date, days: number): Date {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

export function sortAsc(points: FinancialChartPoint[]): FinancialChartPoint[] {
  return [...points].sort((a, b) => toDayKey(a.date).localeCompare(toDayKey(b.date)));
}

export function fillDailyGaps(points: FinancialChartPoint[]): FinancialChartPoint[] {
  const sorted = sortAsc(points);
  if (sorted.length === 0) return [];

  const map = new Map<string, FinancialChartPoint>();
  for (const p of sorted) {
    const k = toDayKey(p.date);
    map.set(k, {
      date: k,
      vending: Number(p.vending ?? 0),
      bills: Number(p.bills ?? 0),
      revenue: Number(p.revenue ?? 0),
      expenses: Number(p.expenses ?? 0),
    });
  }

  const firstKey = toDayKey(sorted[0].date);
  const lastKey = toDayKey(sorted.at(-1)!.date);
  const start = parseDayKey(firstKey);
  const end = parseDayKey(lastKey);

  const out: FinancialChartPoint[] = [];
  for (let cur = start; cur <= end; cur = addDaysUtc(cur, 1)) {
    const key = formatDayKey(cur);
    out.push(
      map.get(key) ?? { date: key, vending: 0, bills: 0, revenue: 0, expenses: 0 },
    );
  }
  return out;
}

export function bucketByMonth(points: FinancialChartPoint[]): Array<FinancialChartPoint & { label: string }> {
  const sorted = sortAsc(points);
  const map = new Map<string, FinancialChartPoint>();
  for (const p of sorted) {
    const key = toDayKey(p.date).slice(0, 7); // YYYY-MM
    const existing = map.get(key) ?? { date: key, vending: 0, bills: 0, revenue: 0, expenses: 0 };
    existing.vending += Number(p.vending ?? 0);
    existing.bills += Number(p.bills ?? 0);
    existing.revenue += Number(p.revenue ?? 0);
    existing.expenses += Number(p.expenses ?? 0);
    map.set(key, existing);
  }
  return Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => {
      const mm = Number(String(p.date).slice(5, 7));
      const label = MONTH_SHORT[Math.max(0, Math.min(11, mm - 1))] ?? p.date;
      return { ...p, label };
    });
}

export function bucketByYear(points: FinancialChartPoint[]): Array<FinancialChartPoint & { label: string }> {
  const sorted = sortAsc(points);
  const map = new Map<string, FinancialChartPoint>();
  for (const p of sorted) {
    const key = toDayKey(p.date).slice(0, 4); // YYYY
    const existing = map.get(key) ?? { date: key, vending: 0, bills: 0, revenue: 0, expenses: 0 };
    existing.vending += Number(p.vending ?? 0);
    existing.bills += Number(p.bills ?? 0);
    existing.revenue += Number(p.revenue ?? 0);
    existing.expenses += Number(p.expenses ?? 0);
    map.set(key, existing);
  }
  return Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({ ...p, label: p.date }));
}

export function buildChartSeries(
  rawPoints: FinancialChartPoint[],
  granularity: FinancialChartGranularity,
): Array<FinancialChartPoint & { label: string }> {
  const normalized = (rawPoints ?? []).map((p) => ({
    date: toDayKey(p.date),
    vending: Number(p.vending ?? 0),
    bills: Number(p.bills ?? 0),
    revenue: Number(p.revenue ?? 0),
    expenses: Number(p.expenses ?? 0),
  }));

  if (granularity === "day") {
    const filled = fillDailyGaps(normalized);
    return filled.map((p) => ({ ...p, label: p.date.slice(5) })); // MM-DD
  }
  if (granularity === "month") return bucketByMonth(normalized);
  return bucketByYear(normalized);
}

export function formatNairaCompact(value: number): string {
  const n = Number(value ?? 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const fmt = (v: number) => {
    const s = v.toFixed(v >= 100 ? 0 : 1);
    return s.endsWith(".0") ? s.slice(0, -2) : s;
  };
  if (abs >= 1_000_000_000) return `₦${sign}${fmt(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `₦${sign}${fmt(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `₦${sign}${fmt(abs / 1_000)}K`;
  return `₦${sign}${abs}`;
}

export function formatNairaFull(value: number): string {
  return `₦${Number(value ?? 0).toLocaleString()}`;
}

export function keysForCategory(category: FinancialChartCategory): Array<keyof FinancialChartPoint> {
  if (category === "bills") return ["bills", "expenses"];
  if (category === "vending") return ["vending", "expenses"];
  return ["vending", "bills", "revenue", "expenses"];
}

