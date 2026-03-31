"use client";

export type RowKeyCandidate = {
  id?: string | number | null;
  _id?: string | number | null;
} & Record<string, unknown>;

/**
 * Creates a stable row-key generator for table rows.
 * - Uses `id` or `_id` when present.
 * - Otherwise assigns a stable key per object reference via WeakMap.
 * - Falls back to index for primitives / null / undefined.
 */
export function createRowKeyGenerator(prefix = "row") {
  let seq = 0;
  const map = new WeakMap<object, string>();

  return function getRowKey(item: unknown, index: number): string {
    if (item && typeof item === "object") {
      const anyItem = item as RowKeyCandidate;
      const id = anyItem.id ?? anyItem._id;
      if (id != null && String(id).trim() !== "") {
        return `${prefix}:${String(id)}`;
      }

      const existing = map.get(item);
      if (existing) return existing;
      const next = `${prefix}:wm:${++seq}`;
      map.set(item, next);
      return next;
    }

    return `${prefix}:idx:${index}`;
  };
}

