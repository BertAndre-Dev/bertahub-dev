/** Values accepted by POST/PUT /api/v1/asset-maintenance */
export const MAINTENANCE_FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "bi-monthly", label: "Bi-monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "bi-quarterly", label: "Bi-quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "bi-yearly", label: "Bi-yearly" },
] as const;

export type MaintenanceFrequency =
  (typeof MAINTENANCE_FREQUENCY_OPTIONS)[number]["value"];

export function normalizeMaintenanceFrequency(frequency?: string) {
  return frequency?.toLowerCase().replace(/_/g, "-").trim() ?? "";
}

/** Advance a date by one maintenance interval (supports API values and legacy aliases). */
export function addMaintenanceInterval(date: Date, frequency?: string): Date {
  const d = new Date(date);
  const freq = normalizeMaintenanceFrequency(frequency);

  switch (freq) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "bi-weekly":
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "bi-monthly":
      d.setMonth(d.getMonth() + 2);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "bi-quarterly":
      d.setMonth(d.getMonth() + 6);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    case "bi-yearly":
      d.setFullYear(d.getFullYear() + 2);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }

  return d;
}

export function isInspectionFrequency(frequency?: string) {
  const freq = normalizeMaintenanceFrequency(frequency);
  return (
    freq === "quarterly" ||
    freq === "bi-quarterly" ||
    freq === "yearly" ||
    freq === "bi-yearly"
  );
}

const LEGACY_FREQUENCY_MAP: Record<string, MaintenanceFrequency> = {
  biweekly: "bi-weekly",
  daily: "weekly",
};

/** Map stored/API/legacy values to a valid select option value. */
export function toApiMaintenanceFrequency(frequency?: string): MaintenanceFrequency {
  const freq = normalizeMaintenanceFrequency(frequency);
  if (MAINTENANCE_FREQUENCY_OPTIONS.some((o) => o.value === freq)) {
    return freq as MaintenanceFrequency;
  }
  return LEGACY_FREQUENCY_MAP[freq] ?? "weekly";
}
