export function parseCompanyFromUser(data: Record<string, unknown>): {
  id: string;
  name: string;
} | null {
  const rawCompanyId = data.companyId as
    | string
    | { id?: string; _id?: string; name?: string }
    | undefined;
  const companyFromObj = data.company as
    | { id?: string; _id?: string; name?: string }
    | undefined;

  const id =
    typeof rawCompanyId === "string"
      ? rawCompanyId
      : rawCompanyId?._id ||
        rawCompanyId?.id ||
        companyFromObj?._id ||
        companyFromObj?.id ||
        "";
  if (!id) return null;

  const name =
    (typeof rawCompanyId === "object" ? rawCompanyId?.name : undefined) ||
    companyFromObj?.name ||
    (data.companyName as string | undefined) ||
    "Company";

  return { id, name };
}
