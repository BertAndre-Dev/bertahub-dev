import { formatDate } from "@/lib/format-date";
import type {
  PlatformFeeAnalytics,
  PlatformFeeCards,
  PlatformFeeListItem,
  PlatformFeeSourceStat,
} from "@/types/analytics";

function csvEscape(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\r\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
  return str;
}

function isSourceStat(value: unknown): value is PlatformFeeSourceStat {
  return (
    typeof value === "object" &&
    value !== null &&
    "total" in value &&
    "count" in value
  );
}

function sourceEntries(cards: PlatformFeeCards): Array<{
  key: string;
  total: number;
  count: number;
}> {
  return Object.entries(cards).flatMap(([key, value]) => {
    if (key === "total" || key === "count") return [];
    if (!isSourceStat(value)) return [];
    return [
      {
        key,
        total: Number(value.total ?? 0),
        count: Number(value.count ?? 0),
      },
    ];
  });
}

function downloadCsv(fileName: string, lines: string[]): void {
  const csv = lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName.replace(/[^a-z0-9-_]/gi, "_")}_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function blank(): string {
  return "";
}

export function exportPlatformFeeAnalyticsToCsv(
  data: PlatformFeeAnalytics,
  list: PlatformFeeListItem[],
  options?: { fileName?: string },
): boolean {
  const lines: string[] = [];
  const push = (row: Array<string | number>) =>
    lines.push(row.map(csvEscape).join(","));

  push(["Platform fees"]);
  push(["Start date", formatDate(data.period?.startDate, data.period?.startDate ?? "")]);
  push(["End date", formatDate(data.period?.endDate, data.period?.endDate ?? "")]);
  if (data.account?.accountNumber) {
    push(["Settlement account", data.account.accountNumber]);
  }
  if (data.account?.bankCode) {
    push(["Bank code", data.account.bankCode]);
  }
  push(["Total settled fees", Number(data.cards?.total ?? 0)]);
  push(["Fee transactions", Number(data.cards?.count ?? 0)]);
  lines.push(blank());

  const sources = sourceEntries(data.cards ?? ({} as PlatformFeeCards));
  if (sources.length) {
    push(["Source totals"]);
    push(["Source", "Amount", "Count"]);
    for (const source of sources) {
      push([source.key, source.total, source.count]);
    }
    lines.push(blank());
  }

  const pie = data.pieChart ?? [];
  if (pie.length) {
    push(["Fee sources"]);
    push(["Source", "Amount"]);
    for (const slice of pie) {
      push([slice.label, Number(slice.value ?? 0)]);
    }
    lines.push(blank());
  }

  const bar = data.barChart;
  const series = bar?.series ?? [];
  const categories = bar?.categories ?? [];
  if (bar && series.length && categories.length) {
    push(["Fee trend", bar.granularity ?? ""]);
    push(["Period", ...series.map((item) => item.name)]);
    categories.forEach((category, index) => {
      push([
        category,
        ...series.map((item) => Number(item.data?.[index] ?? 0)),
      ]);
    });
    lines.push(blank());
  }

  push(["Settled fees"]);
  push(["Date", "Source", "Fee", "Description"]);
  for (const item of list) {
    push([
      formatDate(item.date, item.date ?? ""),
      item.source ?? "",
      Number(item.fee ?? 0),
      item.description ?? "",
    ]);
  }

  downloadCsv(options?.fileName ?? "platform_fees", lines);
  return true;
}
