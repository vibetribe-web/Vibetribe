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

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
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
      throw new ApiError("Please login again", 401);
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
    throw new ApiError(
      "Unable to reach VibeTribe API. Check network, CORS, and backend deployment.",
      0,
      error,
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
    const rawMessage =
      (isRecord(data) ? data.error : undefined) ??
      (isRecord(data) ? data.detail : undefined) ??
      (isRecord(data) ? data.message : undefined) ??
      (typeof data === "string" ? data : "Something went wrong");
    const message = typeof rawMessage === "string" ? rawMessage : "Something went wrong";
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
