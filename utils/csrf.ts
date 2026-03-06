import axios from "axios";

let csrfToken = "";
let inFlightFetch: Promise<string> | null = null;

export function getCsrfToken(): string {
  return csrfToken;
}

export function setCsrfToken(token: string): void {
  csrfToken = token || "";
}

export function clearCsrfToken(): void {
  csrfToken = "";
  inFlightFetch = null;
}

function readTokenFromAxiosHeaders(headers: unknown): string | null {
  if (!headers || typeof headers !== "object") return null;
  const h = headers as Record<string, unknown>;
  const token =
    (h["x-csrf-token"] as string | undefined) ??
    (h["X-CSRF-Token"] as string | undefined);
  return typeof token === "string" && token.trim() ? token : null;
}

export function updateCsrfFromResponseHeaders(headers: unknown): void {
  const token = readTokenFromAxiosHeaders(headers);
  if (token) setCsrfToken(token);
}

function getCsrfUrl(): string {
  // On the client, use the rewrite proxy for same-origin cookies.
  if (globalThis.window !== undefined) return "/api/v1/auth-mgt/csrf-token";
  return `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}api/v1/auth-mgt/csrf-token`;
}

export async function fetchCsrfToken(accessToken?: string | null): Promise<string> {
  const res = await axios.get(getCsrfUrl(), {
    withCredentials: true,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  const tokenFromHeader = readTokenFromAxiosHeaders(res.headers);
  const tokenFromBody =
    typeof res.data?.csrfToken === "string" ? (res.data.csrfToken as string) : null;
  const token = tokenFromHeader ?? tokenFromBody ?? "";

  if (token) setCsrfToken(token);
  return token;
}

/**
 * Ensures there is a CSRF token in memory for authenticated sessions.
 * Uses a single in-flight promise to avoid duplicate token fetches.
 */
export async function ensureCsrfToken(accessToken?: string | null): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!accessToken) return "";

  inFlightFetch ??= fetchCsrfToken(accessToken).finally(() => {
    inFlightFetch = null;
  });

  return inFlightFetch;
}

