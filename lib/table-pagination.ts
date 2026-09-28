export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

export type TablePageSize = (typeof TABLE_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_TABLE_PAGE_SIZE = 10;

export function tablePageSizeOptions(current?: number): number[] {
  const sizes = new Set<number>(TABLE_PAGE_SIZE_OPTIONS);
  if (current && current > 0) sizes.add(current);
  return Array.from(sizes).sort((a, b) => a - b);
}
