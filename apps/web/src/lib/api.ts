export interface User {
  id: string;
  username: string;
}

export interface Website {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface StatusResponse {
  needsSetup: boolean;
  authenticated: boolean;
  user: User | null;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getStatus: () => request<StatusResponse>("/api/status"),
  setup: (username: string, password: string) =>
    request<{ ok: boolean; user: User }>("/api/setup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<{ ok: boolean; user: User }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: boolean }>("/api/logout", { method: "POST" }),
  getWebsites: () => request<Website[]>("/api/websites"),
  createWebsite: (name: string) =>
    request<Website>("/api/websites", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  deleteWebsite: (id: string) =>
    request<{ ok: boolean }>(`/api/websites/${id}`, { method: "DELETE" }),
};
