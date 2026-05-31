/** Shared helpers for GET /api/v1/assets response normalization. */

export type AssetApiRecord = {
  id?: string;
  _id?: string;
  name?: string;
  tag?: string;
  assetCategoryId?: string | Record<string, unknown>;
  estateId?: string | Record<string, unknown>;
  companyId?: string;
  amount?: number;
  useFullLife?: number;
  datePurchased?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type AssetApiPagination = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
};

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function normalizeAssetId(raw: AssetApiRecord): string {
  return String(raw.id ?? raw._id ?? "").trim();
}

/** Ensure asset rows expose a stable `id` while preserving API fields. */
export function normalizeAssetList(data: unknown): AssetApiRecord[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const row = item as AssetApiRecord;
      const id = normalizeAssetId(row);
      return {
        ...row,
        ...(id ? { id, _id: id } : {}),
      };
    });
}

/** Map backend pagination keys to the shape used across asset tables. */
export function normalizeAssetPagination(
  pagination: unknown,
): AssetApiPagination | null {
  if (!pagination || typeof pagination !== "object") return null;

  const p = pagination as Record<string, unknown>;
  const total = toNumber(p.total, 0);
  const currentPage = toNumber(p.currentPage ?? p.page, 1);
  const pageSize = toNumber(p.pageSize ?? p.limit, 10);
  const totalPages = toNumber(p.totalPages ?? p.pages, 1);

  return {
    total,
    currentPage,
    page: currentPage,
    pageSize,
    limit: pageSize,
    totalPages,
    pages: totalPages,
  };
}
