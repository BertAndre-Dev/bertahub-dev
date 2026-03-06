import axios, { type AxiosError } from "axios";
import { getStoreState, dispatchToStore } from "@/utils/store-accessor";
import {
  clearCsrfToken,
  ensureCsrfToken,
  getCsrfToken,
  updateCsrfFromResponseHeaders,
} from "@/utils/csrf";

// On the client, use a relative base URL so every request goes through the
// Next.js rewrite proxy (/api/v1/* → https://bertahubdev.com/api/v1/*).
// This makes cookies same-origin, avoiding the SameSite=Lax cross-origin
// cookie block that causes 403 on the refresh-token endpoint.
// On the server (SSR/API routes) we keep the full URL for direct backend access.
const BASE_URL =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_BASE_URL || "");

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the refreshToken HTTP-only cookie automatically
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ─── Lazy Redux action imports ────────────────────────────────────────────────
// Dynamic imports so the module loads without triggering the circular dep at
// initialisation time (axiosInstance → store → auth-mgt-slice → auth-mgt → axiosInstance).
async function getAuthActions() {
  const { logoutLocally, setToken } = await import(
    "@/redux/slice/auth-mgt/auth-mgt-slice"
  );
  return { logoutLocally, setToken };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Reads the stored email — Redux state first, localStorage as fallback. */
function getEmail(): string | null {
  // 1) Try Redux (works after first render / rehydration)
  try {
    const state = getStoreState() as {
      auth?: { user?: { email?: string } | null };
    };
    const email = state.auth?.user?.email;
    if (email) return email;
  } catch {
    // store not injected yet (SSR)
  }

  // 2) localStorage fallback (written by login page before redirect)
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const email = (JSON.parse(raw) as { email?: string }).email;
        if (email) return email;
      }
    } catch {
      // malformed JSON
    }
  }

  return null;
}

/** Reads the current access token from Redux state. */
function getToken(): string | null {
  try {
    const state = getStoreState() as { auth?: { token?: string | null } };
    return state.auth?.token ?? null;
  } catch {
    return null;
  }
}

// ─── Request interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(async (config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = (config.method ?? "get").toLowerCase();
  const safeMethods = ["get", "head", "options"];
  if (safeMethods.includes(method)) return config;

  // Skip CSRF for auth endpoints (they don't require it)
  const url = (config.url ?? "").toString();
  const skipCsrfRoutes = [
    "/auth-mgt/sign-in",
    "/auth-mgt/sign-up",
    "/auth-mgt/pin-login",
    "/auth-mgt/verify-otp",
    "/auth-mgt/resend-otp",
    "/auth-mgt/forgot-password",
    "/auth-mgt/reset-password",
    "/auth-mgt/refresh-token",
    "/auth-mgt/sign-out",
    "/auth-mgt/csrf-token",
  ];
  if (skipCsrfRoutes.some((route) => url.includes(route))) return config;

  // For state-changing requests, ensure CSRF token and attach it.
  const currentCsrf = getCsrfToken();
  const csrf = currentCsrf || (token ? await ensureCsrfToken(token) : "");
  if (csrf) {
    config.headers["X-CSRF-Token"] = csrf;
  }

  return config;
});

// ─── Token refresh ────────────────────────────────────────────────────────────
// One shared promise so concurrent 401 s only trigger one refresh call.
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const email = getEmail();

  if (!email) {
    console.warn("[auth] doRefresh: email not found in Redux state or localStorage — cannot refresh");
    return null;
  }

  console.log("[auth] Access token expired — refreshing for:", email);

  try {
    // Always use the relative path so the request goes through the Next.js
    // proxy — the same mechanism that keeps cookies same-origin on the client.
    const refreshUrl =
      typeof window !== "undefined"
        ? "/api/v1/auth-mgt/refresh-token"
        : `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}api/v1/auth-mgt/refresh-token`;

    const res = await axios.post<{ accessToken?: string; success?: boolean }>(
      refreshUrl,
      { email },
      { withCredentials: true },
    );

    updateCsrfFromResponseHeaders(res.headers);

    const newToken = res.data?.accessToken ?? null;

    if (newToken) {
      const { setToken } = await getAuthActions();
      dispatchToStore(setToken(newToken));
      console.log("[auth] Token refreshed successfully");
    } else {
      console.warn("[auth] Refresh response had no accessToken:", res.data);
    }

    return newToken;
  } catch (err) {
    const axiosErr = err as AxiosError;
    console.error(
      "[auth] Token refresh failed:",
      axiosErr.response?.status,
      axiosErr.response?.data ?? axiosErr.message,
    );
    return null;
  }
}

async function clearSession() {
  console.warn("[auth] Refresh failed — logging out");
  clearCsrfToken();
  try {
    const { logoutLocally } = await getAuthActions();
    dispatchToStore(logoutLocally());
  } catch {
    // fallback: clear manually if Redux isn't available
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("auth");
    }
  }
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
}

// ─── Response interceptor ────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => {
    updateCsrfFromResponseHeaders(response.headers);
    return response;
  },
  async (error: AxiosError) => {
    updateCsrfFromResponseHeaders(error.response?.headers);

    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    // Only intercept 401s; never retry the refresh endpoint itself
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      (originalRequest.url as string | undefined)?.includes("refresh-token")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;

    if (newToken) {
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(originalRequest);
    }

    await clearSession();
    return Promise.reject(error);
  },
);

export default axiosInstance;
