/** Single address from /me: addressIds[] or addressId (id + optional data) */
export type AddressOption = { id: string; data?: Record<string, string> };

export function formatAddressLabel(addr: AddressOption): string {
  if (!addr.data || typeof addr.data !== "object") return addr.id;
  const parts = Object.entries(addr.data)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v}`)
    .join(", ");
  return parts || addr.id;
}

/** Normalize /me response to array of { id, data }. Supports addressIds[] (owner) or addressId (tenant). */
export function normalizeAddresses(meData: Record<string, unknown> | null | undefined): AddressOption[] {
  const rawIds = (meData?.addressIds ?? (meData?.addressId != null ? [meData.addressId] : [])) as unknown;
  if (!Array.isArray(rawIds)) return [];
  return (rawIds as (string | { id?: string; _id?: string; data?: Record<string, string> })[])
    .map((raw) => ({
      id:
        typeof raw === "string"
          ? raw
          : raw?.id ?? (raw as { _id?: string })._id ?? "",
      data: typeof raw === "object" && raw !== null && "data" in raw ? (raw as { data?: Record<string, string> }).data : undefined,
    }))
    .filter((a) => a.id.length > 0);
}

/** Get address ID string from API value (object with id or string). */
export function toAddressIdString(
  addressId: string | { id: string; data?: Record<string, unknown> } | null | undefined
): string | null {
  if (addressId == null) return null;
  if (typeof addressId === "string") return addressId;
  if (typeof addressId === "object" && addressId?.id) return addressId.id;
  return null;
}

/** Render a human-friendly address label from every field on the entry data. */
export function formatAddressEntryLabel(
  data: Record<string, unknown> | undefined | null,
): string {
  if (!data || typeof data !== "object") return "";
  const toStr = (v: unknown) =>
    typeof v === "string" || typeof v === "number" ? String(v).trim() : "";

  return Object.entries(data)
    .map(([key, value]) => {
      const text = toStr(value);
      if (!text) return "";
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      return `${label} ${text}`;
    })
    .filter(Boolean)
    .join(", ");
}

type AddressEntryLike = {
  id?: string;
  data?: Record<string, unknown> | Record<string, string> | null;
};

/** Combine all address entries into one display string (e.g. "Flat V, Unit 1"). */
export function formatUserAddresses(
  addressIds?: AddressEntryLike[] | null,
): string {
  if (!addressIds?.length) return "";
  const labels = addressIds
    .map((address) => {
      const fromData = formatAddressEntryLabel(
        address?.data as Record<string, unknown> | undefined,
      );
      return fromData || address?.id || "";
    })
    .filter((label) => label.length > 0);
  return Array.from(new Set(labels)).join("; ");
}

/** Capitalize the first character of a string (leaves the rest unchanged). */
export function capitalizeFirstLetter(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Body for POST/PUT /api/v1/address-mgt/field.
 * The API whitelist rejects extra properties such as `id`.
 */
export function toAddressFieldBody(data: {
  estateId?: unknown;
  label?: string;
  key?: string;
}): { estateId: string; label: string; key: string } {
  const raw = data.estateId;
  const estateId =
    typeof raw === "string"
      ? raw
      : raw && typeof raw === "object"
        ? String(
            (raw as { _id?: string; id?: string })._id ||
              (raw as { id?: string }).id ||
              "",
          )
        : "";
  return {
    estateId,
    label: data.label ?? "",
    key: data.key ?? "",
  };
}

/** Format address field/entry `createdAt` for admin tables. */
export function formatAddressRecordCreatedAt(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
