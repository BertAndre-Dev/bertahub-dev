export function parseResidentEstate(data: Record<string, unknown>): {
  id: string;
  name: string;
} | null {
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
  if (!id) return null;

  const name =
    (typeof rawEstateId === "object" ? rawEstateId?.name : undefined) ||
    estateFromObj?.name ||
    (data.estateName as string | undefined) ||
    "Estate";

  return { id, name };
}
