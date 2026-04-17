const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const requestInit: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  };

  if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${path}`, requestInit);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Request failed.");
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
