/** Normalize user ids from API payloads (`id`, `_id`, `userId`, or populated objects). */
export function normalizeUserId(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return String(o._id ?? o.id ?? o.userId ?? "").trim();
  }
  return String(raw).trim();
}

export function isSameUserId(a: unknown, b: unknown): boolean {
  const left = normalizeUserId(a);
  const right = normalizeUserId(b);
  return Boolean(left && right && left === right);
}

export function extractUserId(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) return null;
  const id = normalizeUserId(data.id ?? data._id ?? data.userId);
  return id || null;
}
