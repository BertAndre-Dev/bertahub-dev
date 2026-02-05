import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format visitor code as 3 letters, hyphen, then rest (e.g. EZR-HP5O). */
export function formatVisitorCode(raw: string): string {
  const cleaned = (raw || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase()
  if (cleaned.length <= 3) return cleaned
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
}
