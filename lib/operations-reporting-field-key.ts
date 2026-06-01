/**
 * Derive API field key from label — same rules as address field form (camelCase).
 * @see components/admin/address/forms/field-form/page.tsx
 */
export function labelToReportingFieldKey(label: string): string {
  return label
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+/g, "");
}
