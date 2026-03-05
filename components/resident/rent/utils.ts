import type { RentItem } from "@/redux/slice/resident/rent-mgt/rent-mgt";

export function formatDate(val: string | undefined): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString();
  } catch {
    return val;
  }
}

export function formatAddress(rent: RentItem): string {
  const addr = rent.addressId;
  if (!addr) return "—";
  if (typeof addr === "object" && addr?.data) {
    const str = Object.entries(addr.data as Record<string, string>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    return str || (addr && "id" in addr ? String(addr.id) : "") || "—";
  }
  return typeof addr === "string" ? addr : "—";
}

export function formatTenant(rent: RentItem): string {
  const tenant = rent.tenantId;
  if (!tenant) return "—";
  if (typeof tenant === "object") {
    const name = [tenant.firstName, tenant.lastName].filter(Boolean).join(" ");
    return name || tenant.email || tenant.id || "—";
  }
  return typeof tenant === "string" ? tenant : "—";
}

export function formatAddressFromData(data?: Record<string, string>): string {
  if (!data) return "—";
  const str = Object.entries(data)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  return str || "—";
}

export function isoToDateInput(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}
