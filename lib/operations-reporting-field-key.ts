/** Derive API field key from label (alphanumeric, spaces, slashes). */
export function labelToReportingFieldKey(label: string): string {
  return label.replace(/[^a-zA-Z0-9 /]/g, "").trim();
}
