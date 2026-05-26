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
  return (rawIds as (string | { id?: string; data?: Record<string, string> })[])
    .map((raw) => ({
      id: typeof raw === "string" ? raw : raw?.id ?? "",
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

/** Render a human-friendly address label from an entry data object
 *  e.g. { block: "A", unit: "1", street: "Main St" } => "Block A, Unit 1 (Main St)" */
export function formatAddressEntryLabel(
  data: Record<string, unknown> | undefined | null,
): string {
  if (!data || typeof data !== "object") return "";
  const toStr = (v: unknown) =>
    typeof v === "string" || typeof v === "number" ? String(v).trim() : "";

  const block = toStr(data.block);
  const street = toStr(data.street);
  const unit = toStr(data.unit);
  const flat = toStr(data.flat);
  const apartment = toStr(data.apartment);
  const houseNumber = toStr(data.houseNumber);
  const number = toStr(data.number);

  const unitLikeValue =
    unit || flat || apartment || houseNumber || number || "";
  const unitLikeKey = unit
    ? "Unit"
    : flat
      ? "Flat"
      : apartment
        ? "Apartment"
        : houseNumber
          ? "House"
          : number
            ? "No."
            : "";

  if (block && unitLikeValue) {
    const base = `Block ${block}, ${unitLikeKey} ${unitLikeValue}`;
    return street ? `${base} (${street})` : base;
  }
  if (block) {
    const base = `Block ${block}`;
    return street ? `${base} (${street})` : base;
  }
  if (unitLikeValue) {
    const base = `${unitLikeKey} ${unitLikeValue}`;
    return street ? `${base} (${street})` : base;
  }

  const pairs = Object.entries(data)
    .map(([k, v]) => {
      const sv = toStr(v);
      if (!sv) return "";
      const key = k.charAt(0).toUpperCase() + k.slice(1);
      return `${key} ${sv}`;
    })
    .filter(Boolean);

  return pairs.join(", ");
}
