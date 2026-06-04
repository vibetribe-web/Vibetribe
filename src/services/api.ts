const CONFIGURED_API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
).replace(/\/$/, "");
const LOCAL_API_BASE_URL = "http://127.0.0.1:8001";
const API_BASE_URL =
  CONFIGURED_API_BASE_URL || (process.env.NODE_ENV === "development" ? LOCAL_API_BASE_URL : "");
const TOKEN_KEY = "access_token";
const LEGACY_TOKEN_KEY = "vibetribe_token";
const inFlightGetRequests = new Map<string, Promise<unknown>>();

export class ApiError extends Error {
  status: number;
  details?: unknown;
  code?: "offline" | "network" | "auth" | "validation" | "server" | "unknown";

  constructor(
    message: string,
    status: number,
    details?: unknown,
    code: ApiError["code"] = "unknown",
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export function getFriendlyErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
  context?: "login" | "register" | "auth" | "server",
) {
  if (context === "login" && error instanceof ApiError && error.status === 401) {
    return "Invalid email or password. Please try again.";
  }

  if (error instanceof ApiError) {
    if (error.code === "offline") {
      return "You appear to be offline. Please reconnect and try again.";
    }
    if (error.status === 0 || error.code === "network") {
      return "We are having trouble connecting right now. Please check your internet or try again later.";
    }
    if (error.status === 401) {
      return context === "auth" ? "Please sign in again to continue." : "Invalid email or password. Please try again.";
    }
    if (error.status === 403) {
      return "You do not have permission to do that.";
    }
    if (error.status === 409) {
      return "That item already exists. Please try a different option.";
    }
    if (error.status === 422 || error.code === "validation") {
      return "Please check the details and try again.";
    }
    if (error.status >= 500 || error.code === "server") {
      return "We are experiencing server issues. Please try again later.";
    }
    return fallback;
  }

  return fallback;
}

function isBrowserOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (token) return token;

  const legacyToken = window.localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacyToken) {
    window.localStorage.setItem(TOKEN_KEY, legacyToken);
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
  return legacyToken;
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
}

type RequestOptions = RequestInit & {
  auth?: boolean;
  suppressNetworkErrorLog?: boolean;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}) {
  const url = `${API_BASE_URL}${path}`;
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false) {
    const token = getToken();
    if (!token) {
      throw new ApiError("Please sign in again to continue.", 401, undefined, "auth");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const dedupeKey = method === "GET" ? `${url}|${options.auth !== false ? getToken() ?? "" : "public"}` : null;
  if (dedupeKey && inFlightGetRequests.has(dedupeKey)) {
    return inFlightGetRequests.get(dedupeKey) as Promise<T>;
  }

  const request = performRequest<T>(url, path, method, { ...options, headers });
  if (!dedupeKey) return request;

  inFlightGetRequests.set(dedupeKey, request);
  request.then(
    () => inFlightGetRequests.delete(dedupeKey),
    () => inFlightGetRequests.delete(dedupeKey),
  );
  return request;
}

export function healthCheck() {
  if (!API_BASE_URL) return Promise.resolve(null);
  return apiFetch<{ status?: string }>("/health", {
    auth: false,
    suppressNetworkErrorLog: true,
  }).catch(() => null);
}

export { API_BASE_URL };

async function performRequest<T>(
  url: string,
  path: string,
  method: string,
  options: RequestOptions & { headers: Headers },
) {
  recordApiCall(path, method);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
    });
  } catch (error) {
    if (!options.suppressNetworkErrorLog) {
      console.error("API network error:", {
        url,
        method,
        status: 0,
        body: null,
        error: serializeError(error),
      });
    }
    const offline = isBrowserOffline();
    throw new ApiError(
      offline
        ? "You appear to be offline. Please reconnect and try again."
        : "We are having trouble connecting right now. Please check your internet or try again later.",
      0,
      error,
      offline ? "offline" : "network",
    );
  }

  if (response.status === 401) {
    clearToken();
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new ApiError(
      getHttpErrorMessage(response.status, path),
      response.status,
      data,
      getHttpErrorCode(response.status),
    );
  }

  return data as T;
}

function getHttpErrorMessage(status: number, path: string) {
  if (status === 401 && path.includes("/auth/login")) return "Invalid email or password. Please try again.";
  if (status === 401) return "Please sign in again to continue.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 409) return "That item already exists. Please try a different option.";
  if (status === 422) return "Please check the details and try again.";
  if (status >= 500) return "We are experiencing server issues. Please try again later.";
  return "Something went wrong. Please try again.";
}

function getHttpErrorCode(status: number): ApiError["code"] {
  if (status === 401) return "auth";
  if (status === 422) return "validation";
  if (status >= 500) return "server";
  return "unknown";
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return error;
}

function recordApiCall(path: string, method: string) {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") return;

  const metricsWindow = window as typeof window & {
    __VIBETRIBE_API_METRICS__?: Record<string, Record<string, number>>;
  };
  const route = window.location.pathname;
  const metrics = (metricsWindow.__VIBETRIBE_API_METRICS__ ??= {});
  const routeMetrics = (metrics[route] ??= {});
  const key = `${method} ${path}`;
  routeMetrics[key] = (routeMetrics[key] ?? 0) + 1;

  console.debug("[VibeTribe API audit]", route, {
    total: Object.values(routeMetrics).reduce((sum, count) => sum + count, 0),
    calls: routeMetrics,
  });
}
