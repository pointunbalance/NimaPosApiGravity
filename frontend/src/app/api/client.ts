export type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { message?: string; code?: string } | null;
};

export type ApiClientOptions = {
  token?: string | null;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const response = await fetchJson(path, options);

  let payload: ApiEnvelope<T> | null = null;

  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }
  }

  if (!response.ok) {
    throw new ApiError(payload?.error?.message ?? `HTTP ${response.status}`, response.status);
  }

  if (!payload?.ok) {
    throw new ApiError(payload?.error?.message ?? "Unknown API error", response.status);
  }

  return payload.data as T;
}

export async function apiRawRequest<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const response = await fetchJson(path, options);

  let payload: T | null = null;
  try {
    payload = (await response.json()) as T;
  } catch {
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }
  }

  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status}`, response.status);
  }

  return payload as T;
}

async function fetchJson(path: string, options: ApiClientOptions) {
  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
