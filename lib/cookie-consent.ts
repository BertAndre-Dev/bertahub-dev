/**
 * Cookie consent utilities - no external package, React 19 compatible.
 * Persists consent in localStorage for GDPR/CCPA compliance.
 */

export const COOKIE_CONSENT_KEY = "cookie-consent";

export type CookieConsentStatus = "accepted" | "declined" | null;

export function getCookieConsent(): CookieConsentStatus {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === "accepted" || stored === "declined") return stored;
    return null;
  } catch {
    return null;
  }
}

export function setCookieConsent(status: "accepted" | "declined"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, status);
    window.dispatchEvent(new CustomEvent("cookie-consent-change", { detail: status }));
  } catch {
    // Ignore storage errors (e.g. private browsing)
  }
}
