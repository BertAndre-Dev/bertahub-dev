export type EstateOption = { id: string; name: string };

export function parseAdminEstates(data: Record<string, unknown>): EstateOption[] {
  const rawEstates = data.estates;
  if (Array.isArray(rawEstates)) {
    return rawEstates
      .map((e) => {
        const item = e as { id?: string; _id?: string; name?: string };
        const id = item.id || item._id || "";
        if (!id) return null;
        return { id, name: item.name ?? "Estate" };
      })
      .filter((x): x is EstateOption => Boolean(x));
  }

  const rawEstateId = data.estateId as
    | string
    | { id?: string; _id?: string; name?: string }
    | undefined;
  const estateFromObj = data.estate as
    | { id?: string; _id?: string; name?: string }
    | undefined;

  const id =
    typeof rawEstateId === "string"
      ? rawEstateId
      : rawEstateId?._id ||
        rawEstateId?.id ||
        estateFromObj?._id ||
        estateFromObj?.id ||
        "";
  if (!id) return [];

  const name =
    (typeof rawEstateId === "object" ? rawEstateId?.name : undefined) ||
    estateFromObj?.name ||
    (data.estateName as string | undefined) ||
    "Estate";
  return [{ id, name }];
}

export function parseAdminEstate(data: Record<string, unknown>): EstateOption | null {
  const estates = parseAdminEstates(data);
  return estates[0] ?? null;
}
