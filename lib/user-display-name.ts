/** Derive a display name from `/api/v1/auth-mgt/me` payload (`data` or root). */

export function displayNameFromSignedInUser(
  data: Record<string, unknown> | undefined | null,
): string {
  if (!data) return "You";
  const first =
    typeof data.firstName === "string" ? data.firstName.trim() : "";
  const last = typeof data.lastName === "string" ? data.lastName.trim() : "";
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  if (typeof data.name === "string" && data.name.trim()) return data.name.trim();
  if (typeof data.fullName === "string" && data.fullName.trim()) {
    return data.fullName.trim();
  }
  if (typeof data.email === "string" && data.email.trim()) {
    return data.email.trim();
  }
  return "You";
}
