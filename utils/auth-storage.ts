export const AUTH_STORAGE_KEY = "auth";
export const USER_STORAGE_KEY = "user";

type StoredAuth = {
  token?: string | null;
  user?: unknown;
};

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * IMPORTANT:
 * - We intentionally use sessionStorage (per-tab) instead of localStorage (shared across tabs)
 *   to prevent multi-tab user session mixing.
 */
export function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  return safeJsonParse<StoredAuth>(sessionStorage.getItem(AUTH_STORAGE_KEY));
}

export function writeStoredAuth(auth: StoredAuth): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
}

export function readStoredUser(): unknown | null {
  if (typeof window === "undefined") return null;
  return safeJsonParse<unknown>(sessionStorage.getItem(USER_STORAGE_KEY));
}

export function writeStoredUser(user: unknown): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getAuthToken(): string | null {
  const auth = readStoredAuth();
  const token = auth?.token;
  return typeof token === "string" && token.trim() ? token : null;
}

export function getStoredUserEmail(): string | null {
  const auth = readStoredAuth();
  const user = (auth?.user ?? readStoredUser()) as { email?: unknown } | null;
  const email = user?.email;
  return typeof email === "string" && email.trim() ? email : null;
}

