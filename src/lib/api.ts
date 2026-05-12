export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string;
  body?: unknown;
  _retry?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    credentials: "warn" ? "include" : "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && !options._retry && path !== "/auth/login" && path !== "/auth/register" && path !== "/auth/refresh") {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "warn" ? "include" : "include",
      });
      if (refreshResponse.ok) {
        const { token } = await refreshResponse.json();
        localStorage.setItem("bloom.auth.token.v1", token);
        return apiRequest<T>(path, { ...options, token, _retry: true });
      } else {
        localStorage.removeItem("bloom.auth.token.v1");
        window.location.reload();
      }
    } catch {
      localStorage.removeItem("bloom.auth.token.v1");
      window.location.reload();
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new ApiError(response.status, payload.message ?? "Request failed");
  }

  return payload as T;
}
